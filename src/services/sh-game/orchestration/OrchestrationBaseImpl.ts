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
  EmptyArray$,
  EmptyObject$,
  Null$,
  distinctUntilShallowArrayChanged,
  filterItemObservations,
  mapArrayItemsCached,
  observeAll,
} from "@/observables";
import { aspectsMagnitude } from "@/aspects";

import { ElementStackModel } from "../token-models/ElementStackModel";
import { SituationModel } from "../token-models/SituationModel";

import { TokensSource } from "../sources/TokensSource";

import { sphereMatchesToken } from "../observables";

import { OrchestrationBase, OrchestrationSlot } from "./types";

export abstract class OrchestrationBaseImpl implements OrchestrationBase {
  constructor(protected readonly _tokensSource: TokensSource) {}

  abstract get label$(): Observable<string | null>;
  abstract get description$(): Observable<string | null>;
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
      // FIXME: This is ripe for a refactor.
      // Every orchestration save RecipeOrchestration just wants to use situation thresholds
      // RecipeOrchestration needs to calculate them on the fly as the game would.
      this._slots$ = combineLatest([
        this.situation$.pipe(switchMap((s) => s?.thresholds$ ?? EmptyArray$)),
        // Lots of data can come from slotted cards that affect what slots are available:
        // - Aspects can select recipes
        // - The cards themselves can add slots
        this.situation$.pipe(
          switchMap((s) => s?.state$ ?? Null$),
          switchMap((state) => {
            if (state !== "Unstarted") {
              // We only use card thresholds if the situation is unstarted.
              // This is kinda a hack, and this whole mess only exists for RecipeOrchestration anyway.
              return EmptyArray$;
            }

            // Determine slots from cards
            return this.slotAssignments$.pipe(
              // Sort the values to guarentee the order doesn't change on us and mess up our distinct check.
              map((assignments) =>
                Object.keys(assignments)
                  .sort()
                  .map((key) => assignments[key])
                  .filter(isNotNull)
              ),
              distinctUntilShallowArrayChanged(),
              switchMap((assignments) => {
                if (assignments.length === 0) {
                  return EmptyArray$;
                }

                // We want the slots added by cards
                const assignmetThresholds$ = combineLatest(
                  assignments.map((x) =>
                    x.element$.pipe(switchMap((x) => x.slots$))
                  )
                ).pipe(map((slots) => flatten(slots)));

                // We want the aspects of all the cards
                const aspects$ = combineLatest(
                  assignments.map((x) => x.aspectsAndSelf$)
                ).pipe(
                  map((aspectsArray) =>
                    aspectsArray.reduce(
                      (a, b) => combineAspects(a, b),
                      {} as Aspects
                    )
                  )
                );

                return combineLatest([
                  this.situation$.pipe(switchMap((s) => s?.verbId$ ?? Null$)),
                  assignmetThresholds$,
                  aspects$,
                ]).pipe(
                  map(([verbId, assignmentThresholds, aspects]) => {
                    if (!verbId) {
                      return [];
                    }

                    return flatten(assignmentThresholds).filter((spec) => {
                      if (!actionIdMatches(spec.actionId, verbId)) {
                        return false;
                      }

                      if (
                        !aspectsMatchExpression(aspects, spec.ifAspectsPresent)
                      ) {
                        return false;
                      }

                      return true;
                    });
                  })
                );
              })
            );
          })
        ),
      ]).pipe(
        map(([situationThresholds, inputThresholds]) => {
          // Note: situationThresholds will contain duplicate with inputs if it already contains some of the cards, or if we
          // click the prepare button.
          // We still need to process the cards manually because RecipeOrchestration lets you explore without slotting any cards,
          // and submits them all in one go.

          return uniqBy(
            [...situationThresholds, ...inputThresholds],
            (x) => x.id
          );
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
