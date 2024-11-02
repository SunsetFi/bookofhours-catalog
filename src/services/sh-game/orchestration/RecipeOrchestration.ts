import {
  BehaviorSubject,
  Observable,
  Subscription,
  combineLatest,
  debounceTime,
  firstValueFrom,
  map,
  shareReplay,
} from "rxjs";
import {
  Aspects,
  SituationState,
  SphereSpec,
  Verb,
  actionIdMatches,
  aspectsMatchRequirements,
} from "secrethistories-api";

import { switchMapIfNotNull } from "@/observables";

import {
  Compendium,
  ElementModel,
  RecipeModel,
} from "@/services/sh-compendium";

import { BatchingScheduler } from "@/services/scheduler";

import { TokensSource } from "../sources/TokensSource";

import { ElementStackModel } from "../token-models/ElementStackModel";
import { SituationModel } from "../token-models/SituationModel";

import {
  ExecutableOrchestration,
  OrchestrationBase,
  VariableSituationOrchestration,
} from "./types";
import { OrchestrationBaseImpl } from "./OrchestrationBaseImpl";

interface DesiredElementData {
  element: ElementModel;
  aspects: Aspects;
  slots: readonly SphereSpec[];
}
export class RecipeOrchestration
  extends OrchestrationBaseImpl
  implements
    OrchestrationBase,
    ExecutableOrchestration,
    VariableSituationOrchestration
{
  private readonly _situation$ = new BehaviorSubject<SituationModel | null>(
    null
  );

  private readonly _availableSituations$: Observable<SituationModel[]>;

  private readonly _situationVerb$: Observable<Verb | null>;

  private readonly _autofillSubscription: Subscription;

  private _isExecuting = false;

  constructor(
    private readonly _recipe: RecipeModel,
    private readonly _desiredElements: readonly ElementModel[],
    compendium: Compendium,
    tokensSource: TokensSource,
    scheduler: BatchingScheduler
  ) {
    super(tokensSource, scheduler);

    this._situationVerb$ = this._situation$.pipe(
      switchMapIfNotNull((situation) =>
        compendium.getVerbById(situation.verbId)
      )
    );

    const desiredElementData$ = combineLatest(
      _desiredElements.map((element) =>
        combineLatest([element.aspects$, element.slots$]).pipe(
          map(([aspects, slots]) => ({ element, aspects, slots }))
        )
      )
    ).pipe(shareReplay(1));

    this._availableSituations$ = combineLatest([
      this._tokensSource.visibleSituations$,
      desiredElementData$,
    ]).pipe(
      map(([situations, desiredElementData]) =>
        situations.filter((situation) =>
          this._situationIsAvailable(situation, desiredElementData)
        )
      ),
      shareReplay(1)
    );

    // Select a default situation.
    firstValueFrom(this.availableSituations$).then(async (situations) => {
      const situation = situations.find((x) => x.state === "Unstarted");
      if (!situation) {
        return;
      }

      this._situation$.next(situation);
    });

    this._autofillSubscription = this._situation$
      .pipe(debounceTime(700))
      .subscribe((situation) => {
        if (situation) {
          this.autofill(true);
        }
      });
  }

  _onSituationStateUpdated(situationState: SituationState) {
    if (this._isExecuting) {
      return "update-orchestration";
    }

    if (situationState !== "Unstarted" && this._situation$.value != null) {
      this._situation$.next(null);
    }

    return null;
  }

  _dispose() {
    this._situation$.value?.close();
    this._autofillSubscription.unsubscribe();
  }

  private _label$: Observable<string | null> | null = null;
  get label$(): Observable<string | null> {
    if (!this._label$) {
      this._label$ = combineLatest([
        this._situationVerb$,
        this._recipe.label$,
      ]).pipe(
        map(([verb, label]) => {
          if (label === ".") {
            if (verb) {
              return verb.label;
            }

            return null;
          }

          return label;
        })
      );
    }

    return this._label$;
  }

  private _description$: Observable<string | null> | null = null;
  get description$(): Observable<string | null> {
    if (!this._description$) {
      this._description$ = combineLatest([
        this._situationVerb$,
        this._recipe.startDescription$,
      ]).pipe(
        map(([verb, recipeDescription]) => {
          if (recipeDescription === ".") {
            if (verb) {
              return verb.description;
            }

            return null;
          }

          if (recipeDescription) {
            return recipeDescription;
          }

          return null;
        }),
        shareReplay(1)
      );
    }

    return this._description$;
  }

  private _requirements$: Observable<Readonly<Aspects>> | null = null;
  get requirements$(): Observable<Readonly<Aspects>> {
    if (!this._requirements$) {
      this._requirements$ = combineLatest([
        this._recipe.requirements$,
        this.aspects$,
      ]).pipe(
        map(([requirements, aspects]) => {
          const result: Aspects = {};
          for (const aspect of Object.keys(requirements)) {
            const reqValue = requirements[aspect];
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

  get situation$(): Observable<SituationModel | null> {
    return this._situation$;
  }

  get availableSituations$(): Observable<readonly SituationModel[]> {
    return this._availableSituations$;
  }

  private _canExecute$: Observable<boolean> | null = null;
  get canExecute$(): Observable<boolean> {
    if (!this._canExecute$) {
      this._canExecute$ = this._situation$.pipe(
        switchMapIfNotNull((s) => s.canExecute$),
        map((x) => x ?? false),
        shareReplay(1)
      );
    }

    return this._canExecute$;
  }

  selectSituation(situation: SituationModel | null): void {
    this._situation$.next(situation);
  }

  async execute() {
    const situation = await firstValueFrom(this._situation$);
    if (!situation) {
      return false;
    }

    try {
      if (!(await situation.setRecipe(this._recipe.recipeId))) {
        console.warn(
          "Failed to set recipe",
          this._recipe.recipeId,
          "for recipe orchestration"
        );
        return false;
      }

      this._isExecuting = true;
      const didExecute = await situation.execute();
      if (!didExecute) {
        this._isExecuting = false;
        console.warn(
          "Failed to execute recipe",
          this._recipe.recipeId,
          "for recipe orchestration"
        );
        return false;
      }

      // Orchestrator will notice our state change and ask us what to do.
      // We will tell it to replace us due to _isExecuting = true
      return true;
    } catch (e) {
      console.error("Failed to execute", situation.id, e);
      return false;
    }
  }

  protected _createSlotCandidateFilter(
    elementStack: ElementStackModel,
    spec: SphereSpec
  ): Observable<boolean> {
    const requirementKeys = Object.keys(this._recipe.requirements);
    // Our recipe is fixed, so filter candidates by its requirements.
    return elementStack.aspectsAndSelf$.pipe(
      map((aspects) => {
        return Object.keys(aspects).some((aspect) =>
          requirementKeys.includes(aspect)
        );
      })
    );
  }

  protected _slotCandidateWeight(
    item: ElementStackModel,
    spec: SphereSpec
  ): number {
    if (this._desiredElements.some((x) => x.elementId === item.elementId)) {
      // This is one of the elements we want, so mark it as more important.
      return 1;
    }

    return 0;
  }

  private _situationIsAvailable(
    situation: SituationModel,
    desiredElementData: DesiredElementData[]
  ): boolean {
    // Disallow salon situations for now
    if (situation.payloadType === "SalonSituation") {
      return false;
    }

    // WARN: We rely on situation.thresholds, which is dependent on situation state and ongoing recipes.
    // We should be using verb thresholds, but we currently need to be synchronous here and cannot await the verb promise.
    // We might want to make this async to do that.
    // For now, we are just ignoring all situations that cannot start.
    // For UX though, we really want to show them but make them disabled.
    if (situation.state !== "Unstarted") {
      return false;
    }

    if (
      this._recipe.actionId &&
      !actionIdMatches(this._recipe.actionId, situation.verbId)
    ) {
      return false;
    }

    const thresholds = [...situation.thresholds];

    for (const { aspects, slots } of desiredElementData) {
      // As far as I can tell from the game code, only elements slotted into verb thresholds (situation thresholds in our case)
      // can provide slots
      if (
        situation.thresholds.some((t) => aspectsMatchRequirements(aspects, t))
      ) {
        thresholds.push(...slots);
      }
    }

    // Our desired elements must be slottable.
    // We could probably do this in the loop above; im not sure if any recipe
    // requires putting a desired element in anything but a default threshold.
    for (const { aspects } of desiredElementData) {
      if (!thresholds.some((t) => aspectsMatchRequirements(aspects, t))) {
        return false;
      }
    }

    // Note: Specs have ifAspectsPresent, so they might not exist if some aspects are not present.
    // We should filter by that, but we don't really know what our final aspects will be at this point.

    const requiredAspects = Object.keys(this._recipe.requirements);

    // Let's let them through if any of the thresholds match any of the requirements.
    // This doesn't take into account what cards get slotted to what, so may produce false positives.
    if (
      !requiredAspects.some((aspect) =>
        thresholds.some(
          (t) =>
            Object.keys(t.essential).includes(aspect) ||
            (Object.keys(t.required).includes(aspect) &&
              !Object.keys(t.forbidden).includes(aspect))
        )
      )
    ) {
      return false;
    }

    return true;
  }
}
