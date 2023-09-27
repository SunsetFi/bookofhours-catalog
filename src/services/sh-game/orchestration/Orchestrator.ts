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

import { Null$, observableObjectOrEmpty, observeAll } from "@/observables";

import { Compendium, RecipeModel } from "@/services/sh-compendium";
import { API } from "@/services/sh-api";
import { Scheduler } from "@/services/scheduler";

import { RunningSource } from "../sources";
import { GameModel } from "../GameModel";
import { SituationModel } from "../token-models/SituationModel";
import { ElementStackModel } from "../token-models/ElementStackModel";

import {
  AspectRequirement,
  Orchestration,
  OrchestrationRequest,
} from "./types";
import { RecipeOrchestration } from "./RecipeOrchestration";

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
          mergeMap((r) => observableObjectOrEmpty(r?.requirements$))
        ),
        this._orchestration$.pipe(
          mergeMap((o) => observableObjectOrEmpty(o?.slots$)),
          map((slots) =>
            Object.values(slots).map((x) =>
              x.assignment$.pipe(
                mergeMap((x) => observableObjectOrEmpty(x?.aspectsAndSelf$))
              )
            )
          ),
          observeAll(),
          startWith([] as Aspects[])
        ),
      ]).pipe(
        map(([requirements, aspects]) => {
          const result: Record<string, AspectRequirement> = {};
          for (const aspect of Object.keys(requirements)) {
            const reqValue = requirements[aspect];
            let required = Number(reqValue);

            if (Number.isNaN(required)) {
              required = aspects.reduce((sum, slotAspects) => {
                return sum + (slotAspects[reqValue] ?? 0);
              }, 0);
            }

            if (required <= 0) {
              continue;
            }

            result[aspect] = {
              current: 0,
              required,
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

  async requestOrchestration({
    recipeId,
    desiredElementIds,
  }: OrchestrationRequest) {
    const recipe = this._compendium.getRecipeById(recipeId);
    const exists = await firstValueFrom(recipe.exists$);
    if (!exists) {
      return;
    }

    this._orchestration$.next(
      new RecipeOrchestration(recipe, this._gameModel, desiredElementIds ?? [])
    );
  }

  cancel() {
    this._orchestration$.next(null);
  }

  async apply() {
    var operation = this._orchestration$.value;
    if (!operation) {
      return false;
    }

    const [situation, recipe, slots] = await Promise.all([
      firstValueFrom(operation.situation$),
      firstValueFrom(operation.recipe$),
      firstValueFrom(operation.slots$),
    ]);

    if (!situation || !recipe) {
      return false;
    }

    const slotTokens: Record<string, ElementStackModel | null> = {};
    for (const slotId of Object.keys(slots)) {
      slotTokens[slotId] = await firstValueFrom(slots[slotId].assignment$);
    }

    return this._sync(situation, recipe, slotTokens);
  }

  async execute() {
    var operation = this._orchestration$.value;
    if (!operation) {
      return false;
    }

    const [situation, recipe, slots] = await Promise.all([
      firstValueFrom(operation.situation$),
      firstValueFrom(operation.recipe$),
      firstValueFrom(operation.slots$),
    ]);

    if (!situation || !recipe) {
      return false;
    }

    const slotTokens: Record<string, ElementStackModel | null> = {};
    for (const slotId of Object.keys(slots)) {
      slotTokens[slotId] = await firstValueFrom(slots[slotId].assignment$);
    }

    const synced = await this._sync(situation, recipe, slotTokens);
    if (!synced) {
      return false;
    }

    await this._api.executeTokenAtPath(situation.path);
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
            if (token.spherePath !== slotPath) {
              await this._api.updateTokenAtPath(token.path, {
                spherePath: slotPath,
              });
            }
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
