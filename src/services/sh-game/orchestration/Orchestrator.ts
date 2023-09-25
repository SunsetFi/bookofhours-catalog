import { inject, injectable, singleton } from "microinject";
import {
  BehaviorSubject,
  Observable,
  combineLatest,
  firstValueFrom,
  map,
  mergeMap,
  shareReplay,
  startWith,
} from "rxjs";
import { Aspects } from "secrethistories-api";

import { Null$, emptyObjectObservable, observeAll } from "@/observables";

import { Compendium } from "@/services/sh-compendium";

import { GameModel } from "../GameModel";

import { AspectRequirement, Orchestration, OrchestrationSlot } from "./types";
import { RecipeOrchestration } from "./RecipeOrchestration";
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
      // FIXME: Bit weird having this partially rely on the orchestration and partially on us.
      this._canExecute$ = combineLatest([
        this._orchestration$.pipe(mergeMap((x) => x?.solution$ ?? Null$)),
        this.aspectRequirements$,
      ]).pipe(
        map(([solution, reqs]) => {
          if (!solution) {
            console.log("Cannot execute - no solution");
            return false;
          }

          for (const aspect of Object.keys(reqs)) {
            if (reqs[aspect].current < reqs[aspect].required) {
              console.log("Cannot execute - not enough aspect", aspect);
              return false;
            }
          }

          return true;
        }),
        shareReplay(1)
      );
    }

    return this._canExecute$;
  }

  private _aspectRequirements$: Observable<
    Readonly<Record<string, AspectRequirement>>
  > | null = null;
  get aspectRequirements$() {
    if (!this._aspectRequirements$) {
      // This is an absolute monstrosity...
      this._aspectRequirements$ = combineLatest([
        this._orchestration$.pipe(
          mergeMap((o) => o?.recipe$ ?? Null$),
          mergeMap((r) => r?.requirements$ ?? emptyObjectObservable<Aspects>())
        ),
        this._orchestration$.pipe(
          mergeMap(
            (o) =>
              o?.slots$ ??
              emptyObjectObservable<Record<string, OrchestrationSlot>>()
          ),
          map((slots) =>
            Object.values(slots).map((x) =>
              x.assignment$.pipe(
                mergeMap(
                  (x) => x?.aspectsAndSelf$ ?? emptyObjectObservable<Aspects>()
                )
              )
            )
          ),
          observeAll(),
          startWith([])
        ),
      ]).pipe(
        map(([requirements, aspects]) => {
          const result: Record<string, AspectRequirement> = {};
          for (const aspect of Object.keys(requirements)) {
            result[aspect] = {
              current: 0,
              // This can sometimes be calculations, but we can ignore that for now.
              required: Number(requirements[aspect]),
            };
          }

          for (const slotAspects of aspects) {
            for (const aspect of Object.keys(slotAspects)) {
              if (result[aspect]) {
                result[aspect].current += slotAspects[aspect];
              }
            }
          }

          return result;
        }),
        shareReplay(1)
      );
    }

    return this._aspectRequirements$;
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
