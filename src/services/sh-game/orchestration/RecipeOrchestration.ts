import {
  BehaviorSubject,
  Observable,
  Subscription,
  combineLatest,
  debounceTime,
  firstValueFrom,
  map,
  shareReplay,
  switchMap,
} from "rxjs";
import { Aspects, SphereSpec, actionIdMatches } from "secrethistories-api";
import { flatten } from "lodash";

import { switchMapIfNotNull, observeAllMap, EmptyObject$ } from "@/observables";
import { workstationFilterAspects } from "@/aspects";
import { tokenPathContainsChild } from "@/utils";

import {
  Compendium,
  ElementModel,
  RecipeModel,
} from "@/services/sh-compendium";

import { TokensSource } from "../sources/TokensSource";

import { ElementStackModel } from "../token-models/ElementStackModel";
import { SituationModel } from "../token-models/SituationModel";

import {
  ExecutableOrchestration,
  Orchestration,
  OrchestrationBase,
  OrchestrationSlot,
  VariableSituationOrchestration,
} from "./types";
import { OrchestrationBaseImpl } from "./OrchestrationBaseImpl";
import { OrchestrationFactory } from "./OrchestrationFactory";

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

  private readonly _optimisticSlotAssignments$ = new BehaviorSubject<
    Readonly<Record<string, ElementStackModel | null>>
  >({});

  private readonly _availableSituations$: Observable<SituationModel[]>;

  // Hack: Our elements have slots as well.  We need to take that into account when
  // choosing available situations.
  // This will observe all slots added by our desiredElements, and use them in our
  // available situations check to see if that situation can have these slots.
  // This is here entirely for "consider", particularly for considering skills.
  private readonly _desiredElementThresholds$: Observable<SphereSpec[]>;

  private readonly _applyDefaultsSubscription: Subscription;
  private readonly _slotAssigmentsSubscription: Subscription;

  constructor(
    private readonly _recipe: RecipeModel,
    private readonly _desiredElements: readonly ElementModel[],
    private readonly _compendium: Compendium,
    tokensSource: TokensSource,
    private readonly _orchestrationFactory: OrchestrationFactory,
    private readonly _replaceOrchestration: (
      orchestration: Orchestration | null
    ) => void
  ) {
    super(tokensSource);

    // Must set this before accessing availableSituations$
    this._desiredElementThresholds$ = new BehaviorSubject(
      _desiredElements
    ).pipe(
      observeAllMap((item) => item.slots$),
      map((items) => flatten(items)),
      shareReplay(1)
    );

    this._availableSituations$ = combineLatest([
      this._tokensSource.fixedSituations$,
      this._tokensSource.unlockedWorkstations$,
      this._desiredElementThresholds$,
    ]).pipe(
      map(([fixed, workstations, elementThresholds]) => {
        const verbs = [...fixed, ...workstations];

        return verbs.filter((verb) =>
          this._situationIsAvailable(verb, elementThresholds)
        );
      }),
      shareReplay(1)
    );

    // Select a default situation.  This is hackish
    firstValueFrom(this.availableSituations$).then((situations) => {
      const situation = situations.find((x) => x.state === "Unstarted");
      if (!situation) {
        return;
      }

      this._situation$.next(situation);
    });

    this._applyDefaultsSubscription = this.slots$
      .pipe(debounceTime(5))
      .subscribe((slots) => {
        this._pickDefaults(Object.values(slots));
      });

    this._slotAssigmentsSubscription = this._situation$
      .pipe(switchMap((s) => s?.thresholdContents$ ?? EmptyObject$))
      .subscribe((assignments) => {
        console.log("Updating slot assignments", assignments);
        this._optimisticSlotAssignments$.next(assignments);
      });
  }

  _dispose() {
    this._applyDefaultsSubscription.unsubscribe();
    this._slotAssigmentsSubscription.unsubscribe();
  }

  get label$(): Observable<string | null> {
    return this._recipe.label$;
  }

  private _description$: Observable<string> | null = null;
  get description$(): Observable<string> {
    if (!this._description$) {
      this._description$ = combineLatest([
        this._situation$.pipe(
          switchMapIfNotNull((situation) => situation?.verbId$),
          switchMapIfNotNull((verbId) => this._compendium.getVerbById(verbId))
        ),
        this._recipe.startDescription$,
      ]).pipe(
        map(([verb, recipeDescription]) => {
          if (recipeDescription === ".") {
            if (verb) {
              return verb.description;
            }

            return "";
          }

          if (recipeDescription) {
            return recipeDescription;
          }

          return "";
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

  // private _slotAssignments$: Observable<
  //   Readonly<Record<string, ElementStackModel | null>>
  // > | null = null;
  protected get slotAssignments$(): Observable<
    Readonly<Record<string, ElementStackModel | null>>
  > {
    // FIXME: This is indicative of something janky with our observables, as
    // thresholdContents should be immediately updated when the card slotting optimistically updates
    // its sphere path.
    // Even with this hack, we still get flickers and update lag.
    return this._optimisticSlotAssignments$;
    // if (!this._slotAssignments$) {
    //   this._slotAssignments$ = this._situation$.pipe(
    //     switchMap((s) => s?.thresholdContents$ ?? EmptyObject$)
    //   );
    // }

    // return this._slotAssignments$;
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
      await situation.setRecipe(this._recipe.recipeId);
      const didExecute = await situation.execute();
      if (!didExecute) {
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

  protected async _assignSlot(
    spec: SphereSpec,
    element: ElementStackModel | null
  ): Promise<void> {
    const situation = await firstValueFrom(this._situation$);
    if (!situation) {
      return;
    }

    const setSlotContent = await situation.setSlotContents(spec.id, element);

    if (!setSlotContent && element) {
      // TODO: Book of Hours is returning false from TryAcceptToken for ongoing thresholds even though the token is being accepted
      console.warn(
        "Failed to set slot content for new situation.  This is a known bug in this cultist simulator engine.  Forcing token refresh."
      );

      await element.refresh();
    }

    // Do this even if we fail, see bug above.
    this._optimisticSlotAssignments$.next({
      ...this._optimisticSlotAssignments$.value,
      [spec.id]: element,
    });
  }

  private _situationIsAvailable(
    situation: SituationModel,
    additionalThresholds: SphereSpec[]
  ): boolean {
    const requiredAspects = [
      ...Object.keys(this._recipe.requirements).filter((x) =>
        workstationFilterAspects.includes(x)
      ),
    ];

    if (
      this._recipe.actionId &&
      !actionIdMatches(this._recipe.actionId, situation.verbId)
    ) {
      return false;
    }

    const thresholds = [
      ...situation.thresholds,
      ...additionalThresholds.filter(
        (spec) => actionIdMatches(spec.actionId, situation.verbId)
        // There is another thresh controller here: ifAspectsPresent.
        // This changes based on slotted cards, and thus is impossible to factor in for what situations
        // are available.
      ),
    ];

    // Let's let them through if any of the thresholds match any of the requirements.
    // This is required to allow the fixed verb consider to be used to read books, for example
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

  private async _pickDefaults(slots: OrchestrationSlot[]) {
    const situation = await firstValueFrom(this._situation$);
    if (!situation) {
      return;
    }

    // Maybe we should recalculate all of these from the current values, but these should all be warmed up and ready.
    const options = await Promise.all(
      slots.map((slot) =>
        firstValueFrom(slot.availableElementStacks$).then(
          (stacks) => [slot, stacks] as const
        )
      )
    );

    const currentAssignments = await firstValueFrom(this.slotAssignments$);
    const assignments = { ...currentAssignments };
    const assigned = new Set<ElementStackModel>();

    for (const [slot, stacks] of options) {
      const lastSelectedItem = assignments[slot.spec.id] ?? null;
      if (
        lastSelectedItem &&
        !assigned.has(lastSelectedItem) &&
        stacks.includes(lastSelectedItem)
      ) {
        continue;
      }

      const desiredItem = stacks.find(
        (x) =>
          !assigned.has(x) &&
          this._desiredElements.find(
            (desired) => x.elementId === desired.elementId
          )
      );
      if (desiredItem) {
        assigned.add(desiredItem);
        assignments[slot.spec.id] = desiredItem;
        continue;
      }

      // TODO: Pick the item that contributes the most but don't go over.
      const item = stacks.find(
        (x) => !assigned.has(x) && !Object.values(assignments).includes(x)
      );
      if (item) {
        assigned.add(item);
        assignments[slot.spec.id] = item;
        continue;
      }
    }

    let promises: Promise<boolean>[] = [];
    for (const [key, value] of Object.entries(assignments)) {
      if (currentAssignments[key] === value) {
        continue;
      }

      promises.push(situation.setSlotContents(key, value));
    }

    await Promise.all(promises);
    console.log(promises.length, "Defaults set");
  }
}
