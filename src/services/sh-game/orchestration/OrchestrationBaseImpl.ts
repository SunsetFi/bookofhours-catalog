import {
  Observable,
  combineLatest,
  distinctUntilChanged,
  map,
  switchMap,
  shareReplay,
  firstValueFrom,
} from "rxjs";
import {
  Aspects,
  SphereSpec,
  aspectsMatchSphereSpec,
  combineAspects,
} from "secrethistories-api";
import { first, isEqual, omit, pick, sortBy, values } from "lodash";

import { isNotNull } from "@/utils";
import {
  EmptyArray$,
  EmptyObject$,
  filterItemObservations,
  mapArrayItemsCached,
  observeAll,
} from "@/observables";
import { aspectsMagnitude } from "@/aspects";

import { ElementStackModel } from "../token-models/ElementStackModel";
import { SituationModel } from "../token-models/SituationModel";

import { TokensSource } from "../sources/TokensSource";

import { OrchestrationBase, OrchestrationSlot } from "./types";

export abstract class OrchestrationBaseImpl implements OrchestrationBase {
  constructor(protected readonly _tokensSource: TokensSource) {}

  abstract _dispose(): void;

  abstract get label$(): Observable<string | null>;
  abstract get description$(): Observable<string | null>;
  abstract get requirements$(): Observable<Readonly<Aspects>>;
  abstract get situation$(): Observable<SituationModel | null>;

  private _canAutofill$: Observable<boolean> | null = null;
  get canAutofill$() {
    if (!this._canAutofill$) {
      this._canAutofill$ = this.slotAssignments$.pipe(
        map((slots) => values(slots).some((x) => x == null))
      );
    }

    return this._canAutofill$;
  }

  private _slots$: Observable<readonly OrchestrationSlot[]> | null = null;
  get slots$() {
    if (!this._slots$) {
      // FIXME: This is ripe for a refactor.
      // Every orchestration save RecipeOrchestration just wants to use situation thresholds
      // RecipeOrchestration needs to calculate them on the fly as the game would.
      this._slots$ = this.situation$.pipe(
        switchMap((s) => s?.thresholds$ ?? EmptyArray$),
        distinctUntilChanged((a, b) => isEqual(a, b)),
        mapArrayItemsCached((spec) => this._createSlot(spec)),
        shareReplay(1)
      );
    }

    return this._slots$;
  }

  private _slotAssignments$: Observable<
    Readonly<Record<string, ElementStackModel | null>>
  > | null = null;
  protected get slotAssignments$(): Observable<
    Readonly<Record<string, ElementStackModel | null>>
  > {
    if (!this._slotAssignments$) {
      this._slotAssignments$ = this.situation$.pipe(
        switchMap((s) => s?.thresholdContents$ ?? EmptyObject$)
      );
    }

    return this._slotAssignments$;
  }

  private _aspects$: Observable<Readonly<Aspects>> | null = null;
  get aspects$() {
    if (!this._aspects$) {
      this._aspects$ = this.slotAssignments$.pipe(
        map((slots) => {
          if (!slots) {
            return [];
          }

          return Object.values(slots).map((x) =>
            x != null ? x.aspectsAndSelf$ : EmptyObject$
          );
        }),
        observeAll(),
        map((aspectArray) => {
          // This looks like a simple reduce(), but vite throws baffling errors when we use reduce.
          // It also is totally happy to use it, but only the first time, and starts erroring on it when
          // the project rebuilds from totally unrelated areas of the code.
          let result = {} as Aspects;
          for (const aspects of aspectArray) {
            result = combineAspects(result, aspects);
          }

          return result;
        }),
        shareReplay(1)
      );
    }

    return this._aspects$;
  }

  async autofill() {
    const processedIds: string[] = [];
    let unfilledSlot: OrchestrationSlot | null = null;

    // This whole function is gnarly as we are waiting on data from observables.
    // We might want to rewrite this to take less reliance on them.
    // We currently work off assuming that the first item in the slot available elements list is
    // the one we want to pick.

    // FIXME: This gnarly code is to attempt to get the most recent value of slots so that we capture
    // new thresholds that open as a result of previous card slotting.
    // However, it is not working, and we stop before new slots are discovered.
    while (
      (unfilledSlot =
        values(await firstValueFrom(this.slots$)).find(
          (slot) => !processedIds.includes(slot.spec.id)
        ) ?? null) != null
    ) {
      processedIds.push(unfilledSlot.spec.id);

      const existingValue = await firstValueFrom(unfilledSlot.assignment$);
      if (existingValue) {
        continue;
      }

      // TODO: Stop looking at aspects that are satisified.
      // Leave slots blank if the recipe is fully satisfied.

      const candidates = await firstValueFrom(
        unfilledSlot.availableElementStacks$
      );
      const candidate = first(candidates);
      if (candidate) {
        await unfilledSlot.assign(candidate);
      }
    }
  }

  protected abstract _filterSlotCandidates(
    spec: SphereSpec,
    elementStack: ElementStackModel
  ): Observable<boolean>;

  protected _slotCandidateSortWeight(
    item: ElementStackModel,
    spec: SphereSpec
  ) {
    return 0;
  }

  private _createSlot(spec: SphereSpec): OrchestrationSlot {
    const assignment$ = this.slotAssignments$.pipe(
      map((assignments) => assignments[spec.id] ?? null),
      shareReplay(1)
    );
    const availableElementStacks$ = combineLatest([
      this._tokensSource.visibleElementStacks$.pipe(
        filterItemObservations((item) =>
          this._filterSlotCandidates(spec, item)
        ),
        filterItemObservations((item) =>
          item.aspects$.pipe(
            map((aspects) => aspectsMatchSphereSpec(aspects, spec))
          )
        )
      ),
      this.slotAssignments$,
    ]).pipe(
      switchMap(([stacks, assignments]) =>
        this.requirements$.pipe(
          map((requirements) => {
            const assignedCards = Object.values(assignments).filter(isNotNull);
            const requirementKeys = Object.keys(requirements);

            // Remove all cards already assigned (note, this will remove our own assignment, we will re-add)
            stacks = stacks.filter((x) => !assignedCards.includes(x));
            // Force include the currently assigned value, so it can show up in the list even if its not a valid candidate according to our current recipe
            // This is because we may open up a verb already prepopulated.
            const ownValue = assignments[spec.id];
            if (ownValue) {
              stacks.push(ownValue);
            }

            return sortBy(stacks, [
              (stack) => this._slotCandidateSortWeight(stack, spec),
              (stack) => aspectsMagnitude(pick(stack.aspects, requirementKeys)),
              (stack) => aspectsMagnitude(stack.aspects),
            ]).reverse();
          })
        )
      ),
      shareReplay(1)
    );

    return {
      spec,
      locked: spec.greedy,
      assignment$,
      availableElementStacks$,
      assign: (element) => {
        this._assignSlot(spec, element);
      },
    };
  }

  private async _assignSlot(
    spec: SphereSpec,
    element: ElementStackModel | null
  ): Promise<void> {
    const situation = await firstValueFrom(this.situation$);
    if (!situation) {
      return;
    }

    await situation.setSlotContents(spec.id, element);
  }
}
