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
import { Aspects, SphereSpec } from "secrethistories-api";

import {
  EmptyObject$,
  Null$,
  True$,
  filterItemObservations,
} from "@/observables";

import { Compendium, RecipeModel } from "@/services/sh-compendium";

import { ElementStackModel } from "../token-models/ElementStackModel";
import { SituationModel } from "../token-models/SituationModel";

import { TokensSource } from "../sources/TokensSource";

import { OrchestrationBaseImpl } from "./OrchestrationBaseImpl";
import { OrchestrationFactory } from "./OrchestrationFactory";
import {
  ExecutableOrchestration,
  Orchestration,
  VariableSituationOrchestration,
} from "./types";

export class UnstartedSituationOrchestration
  extends OrchestrationBaseImpl
  implements VariableSituationOrchestration, ExecutableOrchestration
{
  private readonly _situationStateSubscription: Subscription;

  private readonly _situation$ = new BehaviorSubject<SituationModel | null>(
    null
  );

  private readonly _recipe$: Observable<RecipeModel | null>;

  private _isExecuting = false;

  constructor(
    situation: SituationModel | null,
    tokensSource: TokensSource,
    private readonly _compendium: Compendium,
    private readonly _orchestrationFactory: OrchestrationFactory,
    private readonly _replaceOrchestration: (
      orchestration: Orchestration | null
    ) => void
  ) {
    super(tokensSource);

    this._situationStateSubscription = this._situation$
      .pipe(switchMap((s) => s?.state$ ?? Null$))
      .subscribe((state) => {
        if (this._isExecuting) {
          return;
        }

        // If we dont have a situation, state will be null.
        // Do not loop inifnitely clearing the situation in this case.
        if (state && state !== "Unstarted") {
          this._situation$.next(null);
        }
      });

    this._situation$.next(situation);

    this._recipe$ = this._situation$.pipe(
      switchMap((situation) => situation?.currentRecipeId$ ?? Null$),
      map((recipeId) =>
        recipeId ? this._compendium.getRecipeById(recipeId) : null
      ),
      // Non-craftable recipes don't count for our purposes.
      switchMap(
        (recipe) =>
          recipe?.craftable$.pipe(
            map((craftable) => (craftable ? recipe : null))
          ) ?? Null$
      ),
      shareReplay(1)
    );

    // TODO: If our selected situation executes without us doing so, close the orchestration.
  }

  _dispose(): void {
    this._situationStateSubscription.unsubscribe();
  }

  private _label$: Observable<string | null> | null = null;
  get label$(): Observable<string | null> {
    if (!this._label$) {
      this._label$ = this._situation$.pipe(
        switchMap((s) => s?.label$ ?? Null$)
      );
    }
    return this._label$;
  }

  private _description$: Observable<string | null> | null = null;
  get description$(): Observable<string | null> {
    if (!this._description$) {
      this._description$ = this._situation$.pipe(
        switchMap((s) => s?.description$ ?? Null$)
      );
    }
    return this._description$;
  }

  private _requirements$: Observable<Readonly<Aspects>> | null = null;
  get requirements$(): Observable<Readonly<Aspects>> {
    if (!this._requirements$) {
      this._requirements$ = combineLatest([
        this._recipe$.pipe(
          switchMap((recipe) => recipe?.requirements$ ?? EmptyObject$)
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
        })
      );
    }

    return this._requirements$;
  }

  private _availableSituations$: Observable<readonly SituationModel[]> | null =
    null;
  get availableSituations$(): Observable<readonly SituationModel[]> {
    if (!this._availableSituations$) {
      this._availableSituations$ = this._tokensSource.visibleSituations$.pipe(
        filterItemObservations((s) =>
          s.state$.pipe(map((s) => s === "Unstarted"))
        )
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
      this._canExecute$ = combineLatest([
        this._recipe$.pipe(
          switchMap((recipe) => (recipe ? recipe.requirements$ : Null$))
        ),
        this.aspects$,
      ]).pipe(
        map(([requirements, aspects]) => {
          if (!requirements) {
            return false;
          }

          for (const aspect of Object.keys(requirements)) {
            const reqValue = requirements[aspect];
            let required = Number(reqValue);

            if (Number.isNaN(required)) {
              required = aspects[reqValue] ?? 0;
            }

            if ((aspects[aspect] ?? 0) < required) {
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

  async execute(): Promise<boolean> {
    if (this._isExecuting) {
      return false;
    }

    this._isExecuting = true;
    let executed = false;
    try {
      const situation = await firstValueFrom(this._situation$);
      if (!situation) {
        return false;
      }

      // Don't need to do this, mod api will tell us if it succeeds.
      // const canExecute = firstValueFrom(this.canExecute$);
      // if (!canExecute) {
      //   return false;
      // }

      // Unsubscribe from our watcher so we dont flicker and remove the orchestration before establishing the ongoing one
      executed = await situation.execute();

      if (executed) {
        this._replaceOrchestration(
          this._orchestrationFactory.createOngoingOrchestration(
            situation,
            this._replaceOrchestration
          )
        );
      }
    } finally {
      this._isExecuting = false;
    }

    return executed;
  }

  protected _filterSlotCandidates(
    spec: SphereSpec,
    elementStack: ElementStackModel
  ): Observable<boolean> {
    return True$;
  }
}
