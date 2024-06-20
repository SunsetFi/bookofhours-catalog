import {
  Observable,
  combineLatest,
  distinctUntilChanged,
  map,
  switchMap,
  shareReplay,
  firstValueFrom,
  tap,
} from "rxjs";
import {
  Aspects,
  SphereSpec,
  aspectsMatchSphereSpec,
  combineAspects,
} from "secrethistories-api";
import { isEqual, omit, pick, sortBy } from "lodash";

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

  private _slots$: Observable<
    Readonly<Record<string, OrchestrationSlot>>
  > | null = null;
  get slots$(): Observable<Readonly<Record<string, OrchestrationSlot>>> {
    if (!this._slots$) {
      // FIXME: This is ripe for a refactor.
      // Every orchestration save RecipeOrchestration just wants to use situation thresholds
      // RecipeOrchestration needs to calculate them on the fly as the game would.
      this._slots$ = this.situation$.pipe(
        switchMap((s) => s?.thresholds$ ?? EmptyArray$),
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
        filterItemObservations((item) =>
          item.aspects$.pipe(
            map((aspects) => aspectsMatchSphereSpec(aspects, spec))
          )
        )
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

  private async _assignSlot(
    spec: SphereSpec,
    element: ElementStackModel | null
  ): Promise<void> {
    const situation = await firstValueFrom(this.situation$);
    if (!situation) {
      return;
    }

    const setSlotContent = await situation.setSlotContents(spec.id, element);

    if (!setSlotContent && element) {
      // TODO: Book of Hours is returning false from TryAcceptToken for ongoing thresholds even though the token is being accepted
      // Note: Starting to see this for other usages as well, particularly when reading books.
      console.warn(
        "Failed to set slot content for new situation.  This is a known bug in this cultist simulator engine.  Forcing token refresh with the assumption that it worked."
      );

      await element.refresh();
    }
  }
}
