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
  aspectsMatchSphereSpec,
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
  Orchestration,
  OrchestrationBase,
  VariableSituationOrchestration,
} from "./types";
import { OrchestrationBaseImpl } from "./OrchestrationBaseImpl";
import { OrchestrationFactory } from "./OrchestrationFactory";

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

  private readonly _situationAutofillSubscription: Subscription;

  constructor(
    private readonly _recipe: RecipeModel,
    private readonly _desiredElements: readonly ElementModel[],
    compendium: Compendium,
    tokensSource: TokensSource,
    scheduler: BatchingScheduler,
    private readonly _orchestrationFactory: OrchestrationFactory,
    private readonly _replaceOrchestration: (
      orchestration: Orchestration | null
    ) => void
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
      map(([situations, desiredElementData]) => {
        return situations.filter((situation) =>
          this._situationIsAvailable(situation, desiredElementData)
        );
      }),
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

    // Note: debounceTime is a hack, as slots$ needs to update first, and it also depends on the situation.
    this._situationAutofillSubscription = this._situation$
      .pipe(debounceTime(10))
      .subscribe((situation) => {
        if (situation) {
          // TODO: If we get a situation with stuff in it, the stuff needs to be emptied before we can auto-fill.
          this.autofill();
        }
      });
  }

  _onSituationStateUpdated(situationState: SituationState): void {
    if (situationState !== "Unstarted" && this._situation$.value != null) {
      this._situation$.next(null);
    }
  }

  _dispose() {
    this._situation$.value?.close();
    this._situationAutofillSubscription.unsubscribe();
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
              return verb.description;
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
      // FIXME: Get this from the game.
      // There might be other cases where the execution cannot happen,
      // such as one-off recipes.
      // ...although those might have been a CS only thing.
      this._canExecute$ = combineLatest([
        this._recipe.requirements$,
        this.aspects$,
      ]).pipe(
        map(([requirements, aspects]) => {
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

      const didExecute = await situation.execute();
      if (!didExecute) {
        console.warn(
          "Failed to execute recipe",
          this._recipe.recipeId,
          "for recipe orchestration"
        );
        return false;
      }

      const ongoingOrchestration =
        this._orchestrationFactory.createOngoingOrchestration(
          situation,
          this._replaceOrchestration
        );
      this._replaceOrchestration(ongoingOrchestration);
      return true;
    } catch (e) {
      console.error("Failed to execute", situation.id, e);
      return false;
    }
  }

  protected _filterSlotCandidates(
    spec: SphereSpec,
    elementStack: ElementStackModel
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

  protected _slotCandidateSortWeight(
    item: ElementStackModel,
    spec: SphereSpec
  ): number {
    if (this._desiredElements.some((x) => x.elementId === item.elementId)) {
      // More important items are at the bottom of the array, which are reversed in the list.
      return 1;
    }

    return 0;
  }

  private _situationIsAvailable(
    situation: SituationModel,
    desiredElementData: DesiredElementData[]
  ): boolean {
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

    const thresholds = [
      ...situation.thresholds,
      // We need to assume that we will have thresholds from the desired cards we wish to slot in.
      // // This is critical in many cases, such as books being readable in consider.
      // ...additionalThresholds.filter(
      //   (spec) => actionIdMatches(spec.actionId, situation.verbId)
      //   // There is another threshold controller here: ifAspectsPresent.
      //   // This changes based on slotted cards, and thus is impossible for us to factor in.
      //   // Maybe in practice, we can use desiredElement aspects?
      // ),
    ];

    for (const { aspects, slots } of desiredElementData) {
      // As far as I can tell from the game code, only elements slotted into verb thresholds (situation thresholds in our case)
      // can provide slots
      if (
        situation.thresholds.some((t) => aspectsMatchSphereSpec(aspects, t))
      ) {
        thresholds.push(...slots);
      }
    }

    // Our desired elements must be slottable.
    // We could probably do this in the loop above; im not sure if any recipe
    // requires putting a desired element in anything but a default threshold.
    for (const { aspects } of desiredElementData) {
      if (!thresholds.some((t) => aspectsMatchSphereSpec(aspects, t))) {
        return false;
      }
    }

    // Note: Specs have ifAspectsPresent, so they might not exist if some aspects are not present.
    // We should filter by that, but we don't really know what our final aspects will be at this point.

    // I dont remember why I added this filter.  Let's try without it.
    // const requiredAspects = [
    //   ...Object.keys(this._recipe.requirements).filter((x) =>
    //     workstationFilterAspects.includes(x)
    //   ),
    // ];
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

    // This code was disabled, but re-enabling it now that we take into account element slots.
    // TODO: In practice we can use situations that don't match this if alternate aspects on cards are accepted.
    // This really is a special / edge case for skills, so maybe restrict the match to the skill card off-aspect.
    // Interestingly enough, this is absolutely required to 'read' phonographs and films.
    // for (const aspect of requiredAspects) {
    //   if (
    //     !thresholds.some(
    //       (t) =>
    //         (Object.keys(t.essential).includes(aspect) ||
    //           Object.keys(t.required).includes(aspect)) &&
    //         !Object.keys(t.forbidden).includes(aspect)
    //     )
    //   ) {
    //     return false;
    //   }
    // }

    return true;
  }
}
