import { inject, injectable, singleton } from "microinject";
import {
  BehaviorSubject,
  Observable,
  combineLatest,
  firstValueFrom,
  map,
  shareReplay,
  startWith,
} from "rxjs";
import { Aspects, combineAspects } from "secrethistories-api";

import { isNotNull } from "@/utils";

import {
  EmptyObject$,
  mergeMapIf,
  mergeMapIfNotNull,
  observeAll,
} from "@/observables";

import { Compendium } from "@/services/sh-compendium";
import { API } from "@/services/sh-api";
import { Scheduler } from "@/services/scheduler";

import { RunningSource } from "../sources/RunningSource";
import { TokensSource } from "../sources/TokensSource";

import {
  AspectRequirement,
  ExecutionPlan,
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

  // These are assisters for other observations we make across this class.
  private readonly _situation$ = this._orchestration$.pipe(
    mergeMapIfNotNull((x) => x.situation$)
  );

  private readonly _recipe$ = this._orchestration$.pipe(
    mergeMapIfNotNull((x) => x.recipe$)
  );

  private readonly _requirements$ = this._recipe$.pipe(
    mergeMapIf(isNotNull, (x) => x.requirements$, EmptyObject$)
  );

  constructor(
    @inject(RunningSource) runningSource: RunningSource,
    @inject(API) private readonly _api: API,
    @inject(Scheduler) private readonly _scheduler: Scheduler,
    @inject(Compendium) private readonly _compendium: Compendium,
    @inject(TokensSource) private readonly _tokensSource: TokensSource
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
        this._situation$,
        this._recipe$,
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
      this._aspectRequirements$ = combineLatest([
        this._requirements$,
        this._orchestration$.pipe(
          mergeMapIfNotNull((o) => o.slots$),
          map((slots) => {
            if (!slots) {
              return [];
            }

            return Object.values(slots).map((x) =>
              x.assignment$.pipe(
                mergeMapIf(isNotNull, (x) => x?.aspectsAndSelf$, EmptyObject$)
              )
            );
          }),
          observeAll(),
          startWith([] as Aspects[]),
          map((aspectArray) => {
            // This looks like a simple reduce(), but vite throws baffling errors when we use reduce.
            // It also is totally happy to use it, but only the first time, and starts erroring on it when
            // the project rebuilds from totally unrelated areas of the code.
            let result = {} as Aspects;
            for (const aspects of aspectArray) {
              result = combineAspects(result, aspects);
            }
            return result;
          })
        ),
      ]).pipe(
        map(([requirements, aspects]) => {
          const result: Record<string, AspectRequirement> = {};
          for (const aspect of Object.keys(requirements)) {
            const reqValue = requirements[aspect];
            let required = Number(reqValue);

            if (Number.isNaN(required)) {
              required = aspects[reqValue] ?? 0;
            }

            if (required <= 0) {
              continue;
            }

            result[aspect] = {
              current: aspects[aspect] ?? 0,
              required,
            };
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

    const desiredElements = (desiredElementIds ?? []).map((id) =>
      this._compendium.getElementById(id)
    );

    this._orchestration$.next(
      new RecipeOrchestration(recipe, this._tokensSource, desiredElements)
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
    const plan = await firstValueFrom(operation.executionPlan$);

    if (!plan) {
      return false;
    }

    return this._sync(plan);
  }

  async execute() {
    var operation = this._orchestration$.value;
    if (!operation) {
      return false;
    }

    const plan = await firstValueFrom(operation.executionPlan$);

    if (!plan) {
      return false;
    }

    const synced = await this._sync(plan);
    if (!synced) {
      return false;
    }

    const result = await plan.situation.execute();
    if (result) {
      this._orchestration$.next(null);
      return true;
    }

    // TODO: Set an error message.
    return false;
  }

  private async _sync(plan: ExecutionPlan) {
    const { situation, recipe, slots } = plan;
    var success = true;
    try {
      await this._scheduler.updateNow();

      // hack: Don't do this for fixedVerbs, they aren't focusable.
      // FIXME: Put this into the api mod logic.
      if (!situation.path.startsWith("~/fixedVerbs")) {
        await this._api.focusTokenAtPath(situation.path);
      }

      await this._api.openTokenAtPath(situation.path);

      for (const slotId of Object.keys(slots)) {
        const slotPath = `${situation.path}/${slotId}`;
        try {
          var token = slots[slotId];
          if (token) {
            if (token.spherePath !== slotPath) {
              await token.moveToSphere(slotPath);
            }
          } else {
            await this._api.evictTokenAtPath(slotPath);
          }
        } catch (e) {
          console.error("Failed to slot", slotId, "to", slotPath, e);
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
