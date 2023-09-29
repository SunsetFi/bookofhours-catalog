import {
  BehaviorSubject,
  Observable,
  combineLatest,
  distinctUntilChanged,
  firstValueFrom,
  map,
  of as observableOf,
  shareReplay,
  throttleTime,
} from "rxjs";
import {
  Aspects,
  SphereSpec,
  combineAspects,
  actionIdMatches,
  aspectsMatchExpression,
} from "secrethistories-api";
import { flatten, isEqual, pick, sortBy } from "lodash";

import {
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
  OrchestrationBase,
  OrchestrationSlot,
  VariableSituationOrchestration,
} from "./types";

export class RecipeOrchestration
  implements OrchestrationBase, VariableSituationOrchestration
{
  private readonly _aspectsFilter$ = new BehaviorSubject<readonly string[]>([]);

  private readonly _situation$ = new BehaviorSubject<SituationModel | null>(
    null
  );
  private readonly _slotAssignments$ = new BehaviorSubject<
    Record<string, ElementStackModel | null>
  >({});

  private readonly _elementStacksMatchingRecipe$: Observable<
    readonly ElementStackModel[]
  >;

  // This is hackish, and really only exists for 'consider' and skill level ups.
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
      const situation = situations[0];
      if (!situation) {
        return;
      }

      this._situation$.next(situation);
    });
  }

  private _recipe$: Observable<RecipeModel | null> | null = null;
  get recipe$(): Observable<RecipeModel | null> {
    if (!this._recipe$) {
      this._recipe$ = observableOf(this._recipe).pipe(shareReplay(1));
    }

    return this._recipe$;
  }

  get aspectsFilter$(): Observable<readonly string[]> {
    return this._aspectsFilter$;
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
        this._aspectsFilter$,
        this._desiredElementThresholds$,
      ]).pipe(
        map(([consider, workstations, aspectsFilter, elementThresholds]) => {
          const verbs = [...workstations];
          if (consider) {
            verbs.push(consider);
          }

          return verbs.filter((verb) =>
            this._situationIsAvailable(verb, aspectsFilter, elementThresholds)
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
      const slottedElements = this._slotAssignments$.pipe(
        // Sort the values to guarentee the order doesn't change on us and mess up our distinct check.
        map((assignments) =>
          Object.keys(assignments)
            .sort()
            .map((key) => assignments[key])
        ),
        map((assignments) =>
          assignments.map((x) => x?.element$).filter(isNotNull)
        ),
        observeAll(),
        shareReplay(1)
      );
      this._slots$ = combineLatest([
        this._situation$,
        // Cards can add slots too, so we need this mess to watch all assignments,
        // get the elements, and get the slots.
        // Honestly, it amazes me that this whole thing hasn't collapsed in on itself with the egregious
        // chain of observables I am shoving into it.
        // Update: We now have to track aspects as well.  Wonderful.
        slottedElements.pipe(
          map((elements) => elements.map((x) => x.slots$)),
          observeAll()
        ),
        slottedElements.pipe(
          map((elements) => elements.map((x) => x.aspects$)),
          observeAll(),
          map((aspectsArray) =>
            aspectsArray.reduce((a, b) => combineAspects(a, b), {} as Aspects)
          )
        ),
      ]).pipe(
        map(([situation, inputThresholds, aspects]) => {
          if (!situation) {
            return [];
          }

          const thresholds = [
            ...situation.thresholds,
            ...flatten(inputThresholds),
          ].filter((spec) => {
            if (!actionIdMatches(spec.actionId, situation.verbId)) {
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
        // This is just more evidence how horribly jank using observables like this is.
        throttleTime(1, undefined, { leading: false, trailing: true })
      );
    }

    return this._slots$;
  }

  setAspectsFilter(aspects: readonly string[]): void {
    this._aspectsFilter$.next(aspects);
    this._tryClearSituation();
  }

  selectSituation(situation: SituationModel | null): void {
    this._situation$.next(situation);
    this._slotAssignments$.next({});
  }

  assignSlot(slotId: string, element: ElementStackModel): void {
    this._slotAssignments$.next({
      ...this._slotAssignments$.value,
      [slotId]: element,
    });
  }

  private async _tryClearSituation() {
    if (!this._situation$.value) {
      return;
    }

    const [filter, thresholds] = await Promise.all([
      firstValueFrom(this._aspectsFilter$),
      firstValueFrom(this._desiredElementThresholds$),
    ]);

    if (
      !this._situationIsAvailable(this._situation$.value, filter, thresholds)
    ) {
      this._situation$.next(null);
      this._slotAssignments$.next({});
    }
  }

  private _createSlot(spec: SphereSpec): OrchestrationSlot {
    const requirementKeys = Object.keys(this._recipe.requirements);

    const availableElementStacks$ = this._elementStacksMatchingRecipe$.pipe(
      filterItemObservations((item) => sphereMatchesToken(spec, item)),
      map((stacks) =>
        sortBy(stacks, [
          (stack) =>
            this._desiredElements.some((x) => x.elementId === stack.elementId)
              ? 1
              : 0,
          (stack) => aspectsMagnitude(pick(stack.aspects, requirementKeys)),
          (stack) => aspectsMagnitude(stack.aspects),
        ]).reverse()
      ),
      shareReplay(1)
    );

    const lastSelectedItem = this._slotAssignments$.value[spec.id] ?? null;
    this._slotAssignments$.next({
      ...this._slotAssignments$.value,
      [spec.id]: null,
    });

    // Select a default value.  This is hackish.
    firstValueFrom(availableElementStacks$).then((stacks) => {
      // Currently have a value.  This can happen when slots regenerate as a result of aspect changes and isAspectsPresent
      if (lastSelectedItem && stacks.includes(lastSelectedItem)) {
        this._slotAssignments$.next({
          ...this._slotAssignments$.value,
          [spec.id]: lastSelectedItem,
        });
        return;
      }

      const item = stacks[0];
      if (!item) {
        return;
      }

      this._slotAssignments$.next({
        ...this._slotAssignments$.value,
        [spec.id]: item,
      });
    });

    return {
      spec,
      locked: false,
      assignment$: this._slotAssignments$.pipe(
        map((assignments) => assignments[spec.id] ?? null)
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

  private _situationIsAvailable(
    situation: SituationModel,
    aspectsFilter: readonly string[],
    additionalThresholds: SphereSpec[]
  ): boolean {
    const requiredAspects = [
      ...aspectsFilter,
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
