import {
  Observable,
  combineLatest,
  distinctUntilChanged,
  map,
  switchMap,
  shareReplay,
  of as observableOf,
} from "rxjs";
import {
  Aspects,
  SphereSpec,
  actionIdMatches,
  aspectsMatchExpression,
  combineAspects,
} from "secrethistories-api";
import { flatten, isEqual, omit, pick, sortBy, uniqBy } from "lodash";

import { isNotNull } from "@/utils";
import {
  EmptyObject$,
  distinctUntilShallowArrayChanged,
  filterItemObservations,
  mapArrayItemsCached,
  observeAll,
} from "@/observables";
import { aspectsMagnitude } from "@/aspects";

import { RecipeModel } from "@/services/sh-compendium";

import { ElementStackModel } from "../token-models/ElementStackModel";
import { SituationModel } from "../token-models/SituationModel";

import { TokensSource } from "../sources/TokensSource";

import { sphereMatchesToken } from "../observables";

import { OrchestrationBase, OrchestrationSlot } from "./types";

export abstract class OrchestrationBaseImpl implements OrchestrationBase {
  constructor(protected readonly _tokensSource: TokensSource) {}

  abstract get label$(): Observable<string | null>;
  abstract get description$(): Observable<string | null>;
  abstract get recipe$(): Observable<RecipeModel | null>;
  abstract get requirements$(): Observable<Readonly<Aspects>>;
  abstract get situation$(): Observable<SituationModel | null>;

  protected abstract get slotAssignments$(): Observable<
    Readonly<Record<string, ElementStackModel | null>>
  >;

  private _slots$: Observable<
    Readonly<Record<string, OrchestrationSlot>>
  > | null = null;
  get slots$(): Observable<Readonly<Record<string, OrchestrationSlot>>> {
    if (!this._slots$) {
      this._slots$ = combineLatest([
        this.situation$.pipe(map((s) => s?.verbId)),
        this.situation$.pipe(map((s) => s?.thresholds ?? [])),
        // Lots of data can come from slotted cards that affect what slots are available:
        // - Aspects can select recipes
        // - The cards themselves can add slots
        this.slotAssignments$.pipe(
          // Sort the values to guarentee the order doesn't change on us and mess up our distinct check.
          map((assignments) =>
            Object.keys(assignments)
              .sort()
              .map((key) => assignments[key])
              .filter(isNotNull)
          ),
          distinctUntilShallowArrayChanged(),
          switchMap((assignments) => {
            // We want the slots added by cards
            const slots$ = observableOf(assignments).pipe(
              map((assignments) =>
                assignments.map((x) =>
                  x.element$.pipe(switchMap((x) => x.slots$))
                )
              ),
              observeAll()
            );

            // We want the aspects of all the cards
            const aspects$ = observableOf(assignments).pipe(
              observeAll((element) => element.aspectsAndSelf$),
              map((aspectsArray) =>
                aspectsArray.reduce(
                  (a, b) => combineAspects(a, b),
                  {} as Aspects
                )
              )
            );

            return combineLatest([slots$, aspects$]);
          })
        ),
      ]).pipe(
        map(([verbId, situationThresholds, [inputThresholds, aspects]]) => {
          if (!verbId) {
            return [];
          }

          let thresholds = [
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

          // Can this happen?  I added logic to check for redundant ids post-create-slot, but I don't recall if that was ever a thing.
          // I must have added it for a reason...
          // Anyway, moving it here so we can save on the expensive createSlot call.
          thresholds = uniqBy(thresholds, (x) => x.id);

          return thresholds;
        }),
        distinctUntilChanged((a, b) => isEqual(a, b)),
        mapArrayItemsCached((spec) => this._createSlot(spec)),
        map((slots) => {
          const result: Record<string, OrchestrationSlot> = {};
          for (const slot of slots) {
            result[slot.spec.id] = slot;
          }

          return result;
        }),
        shareReplay(1)
      );
    }

    return this._slots$;
  }

  abstract _dispose(): void;

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

  protected abstract _filterSlotCandidates(
    spec: SphereSpec,
    elementStack: ElementStackModel
  ): Observable<boolean>;

  protected abstract _assignSlot(
    spec: SphereSpec,
    element: ElementStackModel | null
  ): void;

  private _createSlot(spec: SphereSpec): OrchestrationSlot {
    const availableElementStacks$ = combineLatest([
      this._tokensSource.visibleElementStacks$.pipe(
        filterItemObservations((item) =>
          this._filterSlotCandidates(spec, item)
        ),
        filterItemObservations((item) => sphereMatchesToken(spec, item))
      ),
      this.slotAssignments$.pipe(
        map((assignments) => omit(assignments, spec.id)),
        distinctUntilChanged((a, b) => isEqual(a, b)),
        map((assignments) => Object.values(assignments).filter(isNotNull))
      ),
    ]).pipe(
      switchMap(([stacks, assigned]) =>
        this.requirements$.pipe(
          map((requirements) => {
            const requirementKeys = Object.keys(requirements);
            stacks = stacks.filter((x) => !assigned.includes(x));
            return sortBy(stacks, [
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
      assignment$: this.slotAssignments$.pipe(
        map((assignments) => assignments[spec.id] ?? null),
        shareReplay(1)
      ),
      availableElementStacks$,
      assign: (element) => {
        this._assignSlot(spec, element);
      },
    };
  }
}
