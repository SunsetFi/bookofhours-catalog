import { inject, injectable, singleton } from "microinject";
import {
  BehaviorSubject,
  Observable,
  firstValueFrom,
  map,
  mergeMap,
  shareReplay,
} from "rxjs";

import { Compendium } from "@/services/sh-compendium";

import { GameModel } from "../GameModel";

import { Orchestration } from "./types";
import { RecipeOrchestration } from "./RecipeOrchestration";
import { Null$ } from "@/observables";
import { RunningSource } from "../sources";

@injectable()
@singleton()
export class Orchestrator {
  private readonly _orchestration$ = new BehaviorSubject<Orchestration | null>(
    null
  );

  constructor(
    @inject(RunningSource) runningSource: RunningSource,
    @inject(Compendium) private readonly _compendium: Compendium,
    @inject(GameModel) private readonly _gameModel: GameModel
  ) {
    runningSource.isRunning$.subscribe((isRunning) => {
      if (!isRunning) {
        this.cancel();
      }
    });
  }

  get orchestration$() {
    return this._orchestration$;
  }

  private _canExecute$: Observable<boolean> | null = null;
  get canExecute$() {
    if (!this._canExecute$) {
      this._canExecute$ = this._orchestration$.pipe(
        mergeMap((x) => x?.solution$ ?? Null$),
        map((x) => x != null),
        shareReplay(1)
      );
    }

    return this._canExecute$;
  }

  async beginRecipeOrchestration(recipeId: string) {
    const recipe = this._compendium.getRecipeById(recipeId);
    const exists = await firstValueFrom(recipe.exists$);
    if (!exists) {
      return;
    }

    this._orchestration$.next(new RecipeOrchestration(recipe, this._gameModel));
  }

  cancel() {
    this._orchestration$.next(null);
  }

  async execute() {
    const solution = await firstValueFrom(
      this._orchestration$.pipe(mergeMap((x) => x?.solution$ ?? Null$))
    );
    if (!solution) {
      return;
    }
  }
}
