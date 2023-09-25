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

import {
  EmptyArray$,
  Null$,
  emptyObjectObservable,
  observeAll,
} from "@/observables";

import {
  Compendium,
  ElementModel,
  RecipeModel,
} from "@/services/sh-compendium";
import { API } from "@/services/sh-api";
import { Scheduler } from "@/services/scheduler";

import { RunningSource } from "../sources";
import { GameModel } from "../GameModel";
import { SituationModel } from "../token-models/SituationModel";

import { AspectRequirement, Orchestration, OrchestrationSlot } from "./types";
import { RecipeOrchestration } from "./RecipeOrchestration";
import { ElementStackModel } from "../token-models/ElementStackModel";

@injectable()
@singleton()
export class Orchestrator {
  private readonly _orchestration$ = new BehaviorSubject<Orchestration | null>(
    null
  );

  constructor(
    @inject(RunningSource) runningSource: RunningSource,
    @inject(API) private readonly _api: API,
    @inject(Scheduler) private readonly _scheduler: Scheduler,
    @inject(Compendium) private readonly _compendium: Compendium,
    @inject(GameModel) private readonly _gameModel: GameModel
  ) {
    runningSource.isRunning$.subscribe((isRunning) => {
      if (!isRunning) {
        this.cancel();
      }
    });

    // This was here for live updating the game as options were selected.
    // In practice this is a bit wonky, lets leave it on-demand.
    // this._orchestration$.subscribe((orchestration) => {
    //   if (this._lastSync && !orchestration) {
    //     this._api.updateTokenAtPath(this._lastSync.path, {
    //       open: false,
    //     });
    //   }
    // });

    // combineLatest([
    //   this._orchestration$.pipe(mergeMap((x) => x?.situation$ ?? Null$)),
    //   this._orchestration$.pipe(mergeMap((x) => x?.recipe$ ?? Null$)),
    //   this._orchestration$
    //     .pipe(
    //       mergeMap(
    //         (x) =>
    //           x?.slots$ ??
    //           emptyObjectObservable<Record<string, OrchestrationSlot>>()
    //       )
    //     )
    //     .pipe(
    //       map((x) =>
    //         Object.entries(x).map(([k, v]) =>
    //           v.assignment$.pipe(
    //             map((token) => [k, token] as [string, ElementStackModel | null])
    //           )
    //         )
    //       ),
    //       observeAll(),
    //       map((x) =>
    //         x.reduce((o, [k, v]) => {
    //           o[k] = v;
    //           return o;
    //         }, {} as Record<string, ElementStackModel | null>)
    //       )
    //     ),
    // ]).subscribe(([situation, recipe, slots]) => {
    //   if (!situation || !recipe || !slots) {
    //     return;
    //   }

    //   this._sync(situation, recipe, slots);
    // });
  }

  get orchestration$() {
    return this._orchestration$;
  }

  private _canExecute$: Observable<boolean> | null = null;
  get canExecute$() {
    if (!this._canExecute$) {
      this._canExecute$ = combineLatest([
        this._orchestration$.pipe(mergeMap((x) => x?.situation$ ?? Null$)),
        this._orchestration$.pipe(mergeMap((x) => x?.recipe$ ?? Null$)),
        this.aspectRequirements$,
      ]).pipe(
        map(([situation, recipe, reqs]) => {
          if (!situation || !recipe) {
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
    var operation = this._orchestration$.value;
    if (!operation) {
      return;
    }

    const [situation, recipe, slots] = await Promise.all([
      firstValueFrom(operation.situation$),
      firstValueFrom(operation.recipe$),
      firstValueFrom(operation.slots$),
    ]);

    if (!situation || !recipe) {
      return;
    }

    const slotTokens: Record<string, ElementStackModel | null> = {};
    for (const slotId of Object.keys(slots)) {
      slotTokens[slotId] = await firstValueFrom(slots[slotId].assignment$);
    }

    this._sync(situation, recipe, slotTokens);

    // TODO: Execute
  }

  private async _sync(
    situation: SituationModel,
    recipe: RecipeModel,
    slots: Readonly<Record<string, ElementStackModel | null>>
  ) {
    var success = true;
    try {
      await this._scheduler.updateNow();

      await this._api.focusTokenAtPath(situation.path);
      await this._api.openTokenAtPath(situation.path);
      for (const slotId of situation.thresholds.map((x) => x.id)) {
        const slotPath = `${situation.path}/${slotId}`;

        try {
          var token = slots[slotId];
          if (token) {
            await this._api.updateTokenAtPath(token.path, {
              spherePath: slotPath,
            });
          } else {
            await this._api.evictTokenAtPath(slotPath);
          }
        } catch (e) {
          success = false;
        }
      }

      // TODO: Select recipe
    } catch (e) {
      success = false;
    }

    return success;
  }
}
