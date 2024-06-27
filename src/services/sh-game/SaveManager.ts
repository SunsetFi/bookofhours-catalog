import { inject, injectable, singleton } from "microinject";
import {
  BehaviorSubject,
  Observable,
  defer,
  from,
  retry,
  shareReplay,
} from "rxjs";
import { LegacyId, SaveInfo } from "secrethistories-api";

import { API } from "../sh-api";
import { UpdatePoller } from "../update-poller";
import { DialogService } from "../dialog/DialogService";
import { GameStateSource } from "./sources/GameStateSource";

@injectable()
@singleton()
export class SaveManager {
  private readonly _loadingState$ = new BehaviorSubject<
    "idle" | "game-loading" | "tokens-loading"
  >("idle");
  private readonly _saves$: Observable<readonly SaveInfo[]>;

  constructor(
    @inject(API) private readonly _api: API,
    @inject(GameStateSource) private readonly _gameState: GameStateSource,
    @inject(UpdatePoller) private readonly _poller: UpdatePoller,
    @inject(DialogService) private readonly _dialogService: DialogService
  ) {
    this._saves$ = defer(() =>
      from(this._api.getSaves()).pipe(retry(), shareReplay(1))
    );
  }

  get saves$() {
    return this._saves$;
  }

  get loadingState$() {
    return this._loadingState$;
  }

  async newGame() {
    if (!(await this._checkIsLegacyRunning())) {
      return;
    }

    if (!(await this._checkAutosaveOverride(true))) {
      return;
    }

    await this._doLoad(() => this._api.startLegacy("librarian" as LegacyId));
  }

  async loadSave(saveName: string): Promise<void> {
    if (!(await this._checkIsLegacyRunning())) {
      return;
    }

    if (!(await this._checkAutosaveOverride(false))) {
      return;
    }

    await this._doLoad(() => this._api.loadSave(saveName));
  }

  private async _doLoad(loader: () => void) {
    this._loadingState$.next("game-loading");
    try {
      await loader();
      this._loadingState$.next("tokens-loading");
      await this._poller.updateNow();
    } finally {
      this._loadingState$.next("idle");
    }
  }

  private async _checkAutosaveOverride(forNewGame: boolean) {
    const result = await this._dialogService.showDialog({
      text: `${
        forNewGame ? "Creating a new game" : "Loading an existing save"
      } will override your last autosave.  Are you sure you wish to continue?`,
      actions: [
        { label: "No", completionResult: "cancel" },
        { label: "Yes", completionResult: "confirm", default: true },
      ],
    });

    if (result !== "confirm") {
      return false;
    }

    return true;
  }

  private async _checkIsLegacyRunning() {
    const isRunning = this._gameState.isLegacyRunning;
    if (isRunning) {
      // TODO: Offer to let the user save.
      const result = await this._dialogService.showDialog({
        text: "Loading a new game will loose progress on the current game.  Are you sure you wish to continue?",
        actions: [
          { label: "No", completionResult: "cancel" },
          { label: "Yes", completionResult: "confirm", default: true },
        ],
      });

      if (result !== "confirm") {
        return false;
      }
    }

    return true;
  }
}
