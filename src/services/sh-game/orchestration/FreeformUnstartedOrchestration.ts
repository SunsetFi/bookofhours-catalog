import {
  BehaviorSubject,
  Observable,
  Subscription,
  combineLatest,
  firstValueFrom,
  map,
  shareReplay,
  switchMap,
} from "rxjs";
import { Aspects, SituationState } from "secrethistories-api";

import {
  EmptyObject$,
  Null$,
  filterItemObservations,
  filterItems,
  switchMapIfNotNull,
} from "@/observables";

import { BatchingScheduler } from "@/services/scheduler";

import { Compendium, RecipeModel } from "@/services/sh-compendium";

import { SituationModel } from "../token-models/SituationModel";

import { TokensSource } from "../sources/TokensSource";

import { OrchestrationBaseImpl } from "./OrchestrationBaseImpl";
import {
  ExecutableOrchestration,
  VariableSituationOrchestration,
} from "./types";

/**
 * A generalized orchestration for arbitrary recipes on any unstarted situation.
 *
 * This orchestration does not have a specific recipe or situation, but instead
 * lets the user slot whatever will fit and monitors the situation for whatever recipe
 * the game offers.
 */
export class FreeformUnstartedOrchestration
  extends OrchestrationBaseImpl
  implements VariableSituationOrchestration, ExecutableOrchestration
{
  private readonly _situationStateSubscription: Subscription;

  private readonly _situation$ = new BehaviorSubject<SituationModel | null>(
    null,
  );

  private readonly _recipe$: Observable<RecipeModel | null>;

  private _isExecuting = false;

  constructor(
    situation: SituationModel | null,
    tokensSource: TokensSource,
    private readonly _compendium: Compendium,
    scheduler: BatchingScheduler,
  ) {
    super(tokensSource, scheduler);

    this._situationStateSubscription = this._situation$
      .pipe(switchMapIfNotNull((s) => s.state$))
      .subscribe((state) => {
        if (this._isExecuting) {
          return;
        }

        // If we dont have a situation, state will be null.
        // Do not loop inifunitly clearing the situation in this case.
        if (state && state !== "Unstarted") {
          this._situation$.next(null);
        }
      });

    this._situation$.next(situation);

    this._recipe$ = this._situation$.pipe(
      switchMapIfNotNull((situation) => situation.currentRecipeId$),
      map((recipeId) =>
        recipeId ? this._compendium.getRecipeById(recipeId) : null,
      ),
      // Non-craftable recipes don't count for our purposes.
      switchMapIfNotNull((recipe) =>
        recipe.craftable$.pipe(map((craftable) => (craftable ? recipe : null))),
      ),
      shareReplay(1),
    );
  }

  _onSituationStateUpdated(situationState: SituationState) {
    if (this._isExecuting) {
      return "update-orchestration";
    }

    // Something executed and it wasn't us.  Clear out the selected situation.
    if (situationState !== "Unstarted" && this._situation$.value != null) {
      this._situation$.next(null);
    }

    return null;
  }

  _dispose(): void {
    this._situation$.value?.close();
    this._situationStateSubscription.unsubscribe();
  }

  private _label$: Observable<string | null> | null = null;
  get label$(): Observable<string | null> {
    if (!this._label$) {
      this._label$ = this._situation$.pipe(switchMapIfNotNull((s) => s.label$));
    }
    return this._label$;
  }

  private _description$: Observable<string | null> | null = null;
  get description$(): Observable<string | null> {
    if (!this._description$) {
      this._description$ = this._situation$.pipe(
        switchMapIfNotNull((s) => s.description$),
      );
    }
    return this._description$;
  }

  private _requirements$: Observable<Readonly<Aspects>> | null = null;
  get requirements$(): Observable<Readonly<Aspects>> {
    if (!this._requirements$) {
      this._requirements$ = combineLatest([
        this._recipe$.pipe(
          switchMap((recipe) => recipe?.requirements$ ?? EmptyObject$),
        ),
        this.aspects$,
      ]).pipe(
        map(([requirements, aspects]) => {
          const result: Aspects = {};
          for (const aspect of Object.keys(requirements)) {
            const reqValue = (requirements as any)[aspect];
            let required = Number(reqValue);

            if (Number.isNaN(required)) {
              required = aspects[reqValue] ?? 0;
            } else if (required <= 0) {
              continue;
            }

            result[aspect] = required;
          }

          return result;
        }),
      );
    }

    return this._requirements$;
  }

  private _availableSituations$: Observable<readonly SituationModel[]> | null =
    null;
  get availableSituations$(): Observable<readonly SituationModel[]> {
    if (!this._availableSituations$) {
      this._availableSituations$ = this._tokensSource.visibleSituations$.pipe(
        // Disallow salons for now.
        filterItems((x) => x.payloadType !== "SalonSituation"),
        filterItemObservations((s) =>
          s.state$.pipe(map((s) => s === "Unstarted")),
        ),
      );
    }
    return this._availableSituations$;
  }

  get situation$(): Observable<SituationModel | null> {
    return this._situation$;
  }

  selectSituation(situation: SituationModel | null): void {
    if (situation && situation.state !== "Unstarted") {
      return;
    }

    this._situation$.next(situation);
  }

  private _canExecute$: Observable<boolean> | null = null;
  get canExecute$(): Observable<boolean> {
    if (!this._canExecute$) {
      this._canExecute$ = this._situation$.pipe(
        switchMapIfNotNull((s) => s.canExecute$),
        map((x) => x ?? false),
        shareReplay(1),
      );
    }

    return this._canExecute$;
  }

  async execute(): Promise<boolean> {
    if (this._isExecuting) {
      return false;
    }

    const situation = await firstValueFrom(this._situation$);
    if (!situation) {
      return false;
    }

    this._isExecuting = true;
    const executed = await situation.execute();
    if (!executed) {
      this._isExecuting = false;
    }

    return executed;
  }
}
