import {
  BehaviorSubject,
  Observable,
  asapScheduler,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  firstValueFrom,
  map,
  mergeMap,
  of as observableOf,
  observeOn,
  shareReplay,
} from "rxjs";
import {
  Aspects,
  SphereSpec,
  combineAspects,
  actionIdMatches,
  aspectsMatchExpression,
} from "secrethistories-api";
import { flatten, isEqual, omit, pick, sortBy } from "lodash";

import {
  Null$,
  distinctUntilShallowArrayChanged,
  filterItemObservations,
  mapArrayItemsCached,
  observeAll,
} from "@/observables";
import { isNotNull } from "@/utils";
import { aspectsMagnitude, workstationFilterAspects } from "@/aspects";

import { ElementModel, RecipeModel } from "@/services/sh-compendium";

import { sphereMatchesToken } from "../observables";

import { TokensSource } from "../sources/TokensSource";

import { ElementStackModel } from "../token-models/ElementStackModel";
import { SituationModel } from "../token-models/SituationModel";

import {
  ExecutionPlan,
  OrchestrationBase,
  OrchestrationSlot,
  VariableSituationOrchestration,
} from "./types";

export class RecipeOrchestration
  implements OrchestrationBase, VariableSituationOrchestration
{
  private readonly _situation$ = new BehaviorSubject<SituationModel | null>(
    null
  );
  private readonly _slotAssignments$ = new BehaviorSubject<
    Record<string, ElementStackModel | null>
  >({});

  private readonly _elementStacksMatchingRecipe$: Observable<
    readonly ElementStackModel[]
  >;

  // Hack: Our elements have slots as well.  We need to take that into account when
  // choosing available situations.
  // This will observe all slots added by our desiredElements, and use them in our
  // available situations check to see if that situation can have these slots.
  // This is here entirely for "consider", particularly for considering skills.
  private readonly _desiredElementThresholds$: Observable<SphereSpec[]>;

  constructor(
    private readonly _recipe: RecipeModel,
    private readonly _tokensSource: TokensSource,
    private readonly _desiredElements: readonly ElementModel[]
  ) {
    const requiredAspects = Object.keys(_recipe.requirements);
    this._elementStacksMatchingRecipe$ =
      this._tokensSource.visibleElementStacks$.pipe(
        filterItemObservations((item) =>
          item.aspectsAndSelf$.pipe(
            map((aspects) =>
              Object.keys(aspects).some((r) => requiredAspects.includes(r))
            )
          )
        ),
        distinctUntilShallowArrayChanged(),
        shareReplay(1)
      );

    // Must set this before accessing availableSituations$
    this._desiredElementThresholds$ = new BehaviorSubject(
      _desiredElements
    ).pipe(
      map((items) => items.map((item) => item.slots$)),
      observeAll(),
      map((items) => flatten(items)),
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

    this.slots$.pipe(debounceTime(5)).subscribe((slots) => {
      this._pickDefaults(Object.values(slots));
    });
  }

  private _executionPlan$: Observable<ExecutionPlan | null> | null = null;
  get executionPlan$() {
    if (!this._executionPlan$) {
      this._executionPlan$ = combineLatest([
        this.situation$,
        this.situation$.pipe(mergeMap((s) => s?.state$ ?? Null$)),
        this.slots$,
        this._slotAssignments$,
      ]).pipe(
        map(([situation, situationState, slots, assignments]) => {
          if (!situation || situationState !== "Unstarted") {
            return null;
          }

          const recipe = this._recipe;
          const plan: ExecutionPlan = {
            situation,
            recipe,
            slots: {},
          };

          for (const slotId of Object.keys(slots)) {
            const slot = slots[slotId];
            if (!slot) {
              continue;
            }

            const assignment = assignments[slotId];
            if (!assignment) {
              continue;
            }

            plan.slots[slotId] = assignment;
          }

          return plan;
        }),
        shareReplay(1)
      );
    }

    return this._executionPlan$;
  }

  private _recipe$: Observable<RecipeModel | null> | null = null;
  get recipe$(): Observable<RecipeModel | null> {
    if (!this._recipe$) {
      this._recipe$ = observableOf(this._recipe).pipe(shareReplay(1));
    }

    return this._recipe$;
  }

  get situation$(): Observable<SituationModel | null> {
    return this._situation$;
  }

  private _availableSituations$: Observable<readonly SituationModel[]> | null =
    null;
  get availableSituations$(): Observable<readonly SituationModel[]> {
    if (!this._availableSituations$) {
      this._availableSituations$ = combineLatest([
        this._tokensSource.considerSituation$,
        this._tokensSource.unlockedWorkstations$,
        this._desiredElementThresholds$,
      ]).pipe(
        map(([consider, workstations, elementThresholds]) => {
          const verbs = [...workstations];
          if (consider) {
            verbs.push(consider);
          }

          return verbs.filter((verb) =>
            this._situationIsAvailable(verb, elementThresholds)
          );
        }),
        shareReplay(1)
      );
    }

    return this._availableSituations$;
  }

  private _slots$: Observable<
    Readonly<Record<string, OrchestrationSlot>>
  > | null = null;
  get slots$(): Observable<Readonly<Record<string, OrchestrationSlot>>> {
    if (!this._slots$) {
      // The sheer amount of observeAlls here is a bit concerning.
      const slottedElementStacks = this._slotAssignments$.pipe(
        // Sort the values to guarentee the order doesn't change on us and mess up our distinct check.
        map((assignments) =>
          Object.keys(assignments)
            .sort()
            .map((key) => assignments[key])
            .filter(isNotNull)
        ),
        shareReplay(1)
      );
      this._slots$ = combineLatest([
        this._situation$.pipe(map((s) => s?.verbId)),
        this._situation$.pipe(map((s) => s?.thresholds ?? [])),
        // Cards can add slots too, so we need this mess to watch all assignments,
        // get the elements, and get the slots.
        // Honestly, it amazes me that this whole thing hasn't collapsed in on itself with the egregious
        // chain of observables I am shoving into it.
        // Update: We now have to track aspects as well.  Wonderful.
        slottedElementStacks.pipe(
          map((assignments) =>
            assignments.map((x) => x.element$.pipe(mergeMap((x) => x.slots$)))
          ),
          observeAll()
        ),
        slottedElementStacks.pipe(
          map((elements) => elements.map((x) => x.aspectsAndSelf$)),
          observeAll(),
          map((aspectsArray) =>
            aspectsArray.reduce((a, b) => combineAspects(a, b), {} as Aspects)
          )
        ),
      ]).pipe(
        // The use of a shared slottedElementStacks here means we get 2 rapid updates from slotAssignments changing
        // By default these are listened to with asyncScheduler, but that changes the order of our updates for some reason, leading
        // to older values overriding newer values.
        // What we really want is the null / concurrent scheduler, but this won't take null as an argument and the rxjs
        // docs dont specify how else to get it.
        observeOn(asapScheduler),
        map(([verbId, situationThresholds, inputThresholds, aspects]) => {
          if (!verbId) {
            return [];
          }

          const thresholds = [
            ...situationThresholds,
            ...flatten(inputThresholds),
          ].filter((spec) => {
            if (!actionIdMatches(spec.actionId, verbId)) {
              return false;
            }

            if (!aspectsMatchExpression(aspects, spec.ifAspectsPresent)) {
              return false;
            }

            return true;
          });

          return thresholds;
        }),
        distinctUntilChanged((a, b) => isEqual(a, b)),
        mapArrayItemsCached((spec) => this._createSlot(spec)),
        map((slots) => {
          const result: Record<string, OrchestrationSlot> = {};
          for (const slot of slots) {
            if (result[slot.spec.id]) {
              continue;
            }

            result[slot.spec.id] = slot;
          }

          return result;
        }),
        shareReplay(1)
      );
    }

    return this._slots$;
  }

  selectSituation(situation: SituationModel | null): void {
    this._situation$.next(situation);
    this._slotAssignments$.next({});
  }

  private _createSlot(spec: SphereSpec): OrchestrationSlot {
    const requirementKeys = Object.keys(this._recipe.requirements);

    const availableElementStacks$ = combineLatest([
      this._elementStacksMatchingRecipe$.pipe(
        filterItemObservations((item) => sphereMatchesToken(spec, item))
      ),
      this._slotAssignments$.pipe(
        map((assignments) => omit(assignments, spec.id)),
        distinctUntilChanged((a, b) => isEqual(a, b)),
        map((assignments) => Object.values(assignments).filter(isNotNull))
      ),
    ]).pipe(
      map(([stacks, assigned]) => {
        stacks = stacks.filter((x) => !assigned.includes(x));
        return sortBy(stacks, [
          (stack) =>
            this._desiredElements.some((x) => x.elementId === stack.elementId)
              ? 1
              : 0,
          (stack) => aspectsMagnitude(pick(stack.aspects, requirementKeys)),
          (stack) => aspectsMagnitude(stack.aspects),
        ]).reverse();
      }),
      shareReplay(1)
    );

    return {
      spec,
      locked: false,
      assignment$: this._slotAssignments$.pipe(
        map((assignments) => assignments[spec.id] ?? null),
        shareReplay(1)
      ),
      availableElementStacks$,
      assign: (element) => {
        this._slotAssignments$.next({
          ...this._slotAssignments$.value,
          [spec.id]: element,
        });
      },
    };
  }

  private async _pickDefaults(slots: OrchestrationSlot[]) {
    // Maybe we should recalculate all of these from the current values, but these should all be warmed up and ready.
    const options = await Promise.all(
      slots.map((slot) =>
        firstValueFrom(slot.availableElementStacks$).then(
          (stacks) => [slot, stacks] as const
        )
      )
    );

    const assignments = { ...this._slotAssignments$.value };

    for (const [slot, stacks] of options) {
      const lastSelectedItem = assignments[slot.spec.id] ?? null;
      if (lastSelectedItem && stacks.includes(lastSelectedItem)) {
        continue;
      }

      // TODO: Pick the item by our own logic.
      // Currently we screw with sorting to put the one we want at the top.  Don't rely on this, and let the user
      // order things however.
      const item = stacks.filter(
        (x) => !Object.values(assignments).includes(x)
      )[0];
      if (!item) {
        continue;
      }

      assignments[slot.spec.id] = item;
    }

    this._slotAssignments$.next(assignments);
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

    // TODO: In practice we can use situations that don't match this if alternate aspects on cards are accepted.
    // This really is a special / edge case for skills, so maybe restrict the match to the skill card off-aspect.
    // Interestingly enough, this is absolutely required to 'read' phonographs and films.
    for (const aspect of requiredAspects) {
      if (
        !thresholds.some(
          (t) =>
            (Object.keys(t.essential).includes(aspect) ||
              Object.keys(t.required).includes(aspect)) &&
            !Object.keys(t.forbidden).includes(aspect)
        )
      ) {
        return false;
      }
    }

    return true;
  }
}
