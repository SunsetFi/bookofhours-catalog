import { inject, injectable, singleton } from "microinject";
import {
  BehaviorSubject,
  Observable,
  defer,
  from,
  map,
  retry,
  shareReplay,
} from "rxjs";
import { LegacyId, SaveInfo } from "secrethistories-api";

import { API } from "../../sh-api";
import { UpdatePoller } from "../../update-poller";
import { DialogService } from "../../dialog/DialogService";

import { GameStateSource } from "../sources/GameStateSource";

import NewGameDialogContent from "./NewGameDialogContent";
import SaveGameDialogContent from "./SaveGameDialogContent";

@injectable()
@singleton()
export class SaveManager {
  private readonly _loadingState$ = new BehaviorSubject<
    "idle" | "game-loading" | "tokens-loading" | "game-saving"
  >("idle");
  private readonly _saves$: Observable<readonly SaveInfo[]>;

  private _dialogHandle: Promise<any> | null = null;

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

  get canSave$() {
    return this._gameState.isLegacyRunning$;
  }

  get saves$() {
    return this._saves$;
  }

  private _autosave$: Observable<SaveInfo | null> | null = null;
  get autosave$() {
    if (!this._autosave$) {
      this._autosave$ = this.saves$.pipe(
        map(
          (saves) => saves.find((save) => save.saveName === "AUTOSAVE") ?? null
        )
      );
    }

    return this._autosave$;
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

    if (saveName !== "AUTOSAVE") {
      if (!(await this._checkAutosaveOverride(false))) {
        return;
      }
    }

    await this._doLoad(() => this._api.loadSave(saveName));
  }

  async showSaveGameDialog() {
    if (this._dialogHandle) {
      return;
    }

    var saveDialogPromise = (this._dialogHandle =
      this._dialogService.showDialog({
        type: "component",
        component: SaveGameDialogContent,
      }));

    this._dialogHandle.then(() => {
      if (this._dialogHandle === saveDialogPromise) {
        this._dialogHandle = null;
      }
    });

    const saveName = await saveDialogPromise;
    if (!saveName) {
      return;
    }

    await this.saveAs(saveName);
  }

  async openLoadGameDialog() {
    if (this._dialogHandle) {
      return;
    }

    // This uses the shared SelectGameContent component,
    // which calls back into us.
    // We do not get a result back from this dialog.
    // Instead, we close it when a load is invoked.
    var dialogPromise = (this._dialogHandle = this._dialogService.showDialog({
      type: "component",
      component: NewGameDialogContent,
    }));

    this._dialogHandle.then(() => {
      if (this._dialogHandle === dialogPromise) {
        this._dialogHandle = null;
      }
    });

    const saveName = await dialogPromise;
    if (saveName == null) {
      return;
    }

    await this.loadSave(saveName);
  }

  async autosave(): Promise<void> {
    if (!this._gameState.isLegacyRunning) {
      return;
    }

    await this._doSave(() => this._api.autosave());
  }

  async saveAs(saveName: string): Promise<void> {
    if (!this._gameState.isLegacyRunning) {
      return;
    }

    await this._doSave(() => this._api.createSave(saveName));
  }

  private async _doLoad(loader: () => void) {
    // Little hacky, as the dialog doesn't tell us when it wants to close.
    if (this._dialogHandle) {
      this._dialogService.closeDialog(this._dialogHandle);
      this._dialogHandle = null;
    }

    this._loadingState$.next("game-loading");
    try {
      await loader();
      this._loadingState$.next("tokens-loading");
      await this._poller.updateNow();
    } finally {
      this._loadingState$.next("idle");
    }
  }

  private async _doSave(saver: () => void) {
    this._loadingState$.next("game-saving");
    try {
      await saver();
    } finally {
      this._loadingState$.next("idle");
    }
  }

  private async _checkAutosaveOverride(forNewGame: boolean) {
    const result = await this._dialogService.showDialog({
      type: "action-prompt",
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
        type: "action-prompt",
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
