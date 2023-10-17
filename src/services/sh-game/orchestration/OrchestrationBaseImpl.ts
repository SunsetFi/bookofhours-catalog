import {
  BehaviorSubject,
  Observable,
  asapScheduler,
  combineLatest,
  distinctUntilChanged,
  map,
  mergeMap,
  observeOn,
  shareReplay,
  tap,
} from "rxjs";
import {
  Aspects,
  SphereSpec,
  actionIdMatches,
  aspectsMatchExpression,
  combineAspects,
} from "secrethistories-api";
import { flatten, isEqual, omit, pick, sortBy } from "lodash";

import { isNotNull } from "@/utils";
import {
  EmptyObject$,
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
  protected readonly _slotAssignments$ = new BehaviorSubject<
    Record<string, ElementStackModel | null>
  >({});

  constructor(protected readonly _tokensSource: TokensSource) {}

  abstract get recipe$(): Observable<RecipeModel | null>;
  abstract get requirements$(): Observable<Readonly<Aspects>>;
  abstract get situation$(): Observable<SituationModel | null>;

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
        this.situation$.pipe(map((s) => s?.verbId)),
        this.situation$.pipe(map((s) => s?.thresholds ?? [])),
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

  private _aspects$: Observable<Readonly<Aspects>> | null = null;
  get aspects$() {
    if (!this._aspects$) {
      this._aspects$ = this._slotAssignments$.pipe(
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

  private _createSlot(spec: SphereSpec): OrchestrationSlot {
    const availableElementStacks$ = combineLatest([
      this._tokensSource.visibleElementStacks$.pipe(
        filterItemObservations((item) =>
          this._filterSlotCandidates(spec, item)
        ),
        filterItemObservations((item) => sphereMatchesToken(spec, item))
      ),
      this._slotAssignments$.pipe(
        map((assignments) => omit(assignments, spec.id)),
        distinctUntilChanged((a, b) => isEqual(a, b)),
        map((assignments) => Object.values(assignments).filter(isNotNull))
      ),
    ]).pipe(
      mergeMap(([stacks, assigned]) =>
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
}
