import React from "react";

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

import { API } from "../../sh-api";
import { UpdatePoller } from "../../update-poller";
import { DialogService } from "../../dialog/DialogService";
import { GameStateSource } from "../sources/GameStateSource";

import NewGameDialogContent from "./NewGameDialogContent";

@injectable()
@singleton()
export class SaveManager {
  private readonly _loadingState$ = new BehaviorSubject<
    "idle" | "game-loading" | "tokens-loading" | "game-saving"
  >("idle");
  private readonly _saves$: Observable<readonly SaveInfo[]>;

  private _loadSaveDialogHandle: Promise<any> | null = null;

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

  openLoadGameDialog() {
    if (this._loadSaveDialogHandle) {
      return;
    }

    this._loadSaveDialogHandle = this._dialogService.showDialog({
      type: "component",
      // This is a little janky... vite wont let us use tsx with decorators.
      component: NewGameDialogContent,
    });
    this._loadSaveDialogHandle.then(() => {
      this._loadSaveDialogHandle = null;
    });
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

    // TODO: Capture errors for corrupt saves.
    await this._doSave(() => this._api.createSave(saveName));
  }

  private async _doLoad(loader: () => void) {
    // Little hacky, as the dialog doesn't tell us when it wants to close.
    if (this._loadSaveDialogHandle) {
      this._dialogService.closeDialog(this._loadSaveDialogHandle);
      this._loadSaveDialogHandle = null;
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
