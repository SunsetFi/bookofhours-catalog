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
  aspectsMatchRequirements,
  combineAspects,
} from "secrethistories-api";
import { isEqual, pick, sortBy, values } from "lodash";

import { isNotNull } from "@/utils";
import {
  EmptyArray$,
  EmptyObject$,
  filterItemObservations,
  mapArrayItemsCached,
  observeAll,
  True$,
} from "@/observables";
import { aspectsMagnitude } from "@/aspects";

import { BatchingScheduler } from "@/services/scheduler";

import { ElementStackModel } from "../token-models/ElementStackModel";
import { SituationModel } from "../token-models/SituationModel";

import { TokensSource } from "../sources/TokensSource";

import { OrchestrationBase, OrchestrationSlot } from "./types";

export abstract class OrchestrationBaseImpl implements OrchestrationBase {
  constructor(
    protected readonly _tokensSource: TokensSource,
    private readonly _scheduler: BatchingScheduler
  ) {}

  abstract _dispose(): void;

  abstract get label$(): Observable<string | null>;
  abstract get description$(): Observable<string | null>;
  abstract get requirements$(): Observable<Readonly<Aspects>>;
  abstract get situation$(): Observable<SituationModel | null>;

  private _canAutofill$: Observable<boolean> | null = null;
  get canAutofill$() {
    if (!this._canAutofill$) {
      this._canAutofill$ = combineLatest([
        this.slotAssignments$,
        this.requirements$,
      ]).pipe(
        map(([slots, requirements]) => {
          // Autofill is only useful if we know what we are making.
          if (Object.keys(requirements).length === 0) {
            return false;
          }

          return values(slots).some((x) => x == null);
        })
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

  async autofill(dump: boolean = false) {
    // Autofill involves looking at the orchestration's stated requirements, and
    // choosing cards that meet those requirements.
    // The requirements might be whatever recipe the situation is proposing, or they might be fixed
    // by an orchestration that chooses a specific recipe ahead of time.
    // This process is made more complicated by the fact that slotting a card often changes
    // the available slots of an orchestration, so we need to repeatedly re-evaluate what slots
    // need filling.

    // Once upon a time, our slots did not update the game state until we chose to execute,
    // so we had to do everything through the slot clases.
    // However, we now update the game live as cards are slotted, so we can simply
    // watch the game state and respond to it.

    // Previously, autofill would just pick the topmost card from all slot options.
    // However, now that we are doing this without recourse to the slot model observables,
    // we can be smarter about what we pick.
    // This new implementation will not pick a card for aspects when those aspects are already
    // fully satisfied by the other slotted contents.
    // This means it no longer proposes burning resources pointlessly
    // for some of the simpler crafting recipes.

    return this._scheduler.batchUpdate(async () => {
      const processedIds = new Set<string>();

      const [situation, requirements] = await Promise.all([
        firstValueFrom(this.situation$),
        // Autofill's prerequisites are that we have requirements, so we do not have
        // a use case of requirements changing as we slot cards.
        firstValueFrom(this.requirements$),
      ]);

      const requirementKeys = Object.keys(requirements);
      if (!situation || requirementKeys.length === 0) {
        return;
      }

      // HACK: We might be autofilling the same situation that is currently closing,
      // if the user had a recipe for this situation open and tried to open another recipe
      // that wants the same situation.
      await situation.awaitIdle();

      if (!situation.isOpen) {
        await situation.open();
      } else if (dump) {
        await situation.dump();
      }

      // Wait to get these values until after the dump
      const [tokens, startingAssignments] = await Promise.all([
        firstValueFrom(this._tokensSource.visibleElementStacks$),
        firstValueFrom(this.slotAssignments$),
      ]);

      const assignments = { ...startingAssignments };

      let aspectContents: Aspects = {};
      for (const elementStack of values(assignments)) {
        if (elementStack == null) {
          continue;
        }

        aspectContents = combineAspects(
          aspectContents,
          elementStack.aspectsAndSelf
        );
      }

      const elementStackContributes = (elementStack: ElementStackModel) => {
        // We count an element stack contributing only if it provides
        // aspects that are not fully satisfied by the other slotted cards.
        // This gives slots a chance to fill remaining aspects without overfilling
        // aspects that are already filled by other slotted cards.

        const unsatisfiedAspects = Object.keys(requirements).filter(
          (aspect) => (aspectContents[aspect] ?? 0) < requirements[aspect]
        );

        const stackAspects = elementStack.aspectsAndSelf;

        return unsatisfiedAspects.some((aspect) => stackAspects[aspect] > 0);
      };

      const getNextUnfilledThreshold = () => {
        // This will change as we slot cards through the process.
        const thresholds = situation.thresholds;

        while (true) {
          const nextUnfilled = thresholds.find((x) => !processedIds.has(x.id));
          if (!nextUnfilled) {
            return null;
          }

          processedIds.add(nextUnfilled.id);

          if (assignments[nextUnfilled.id] != null) {
            continue;
          }

          return nextUnfilled;
        }
      };

      let maybeSpec: SphereSpec | null = null;
      while ((maybeSpec = getNextUnfilledThreshold()) != null) {
        const spec = maybeSpec!;

        // Candidates must:
        // - not be in use by another slot
        // - meaningfully contribute to an aspect that is not yet fulfulled.
        // Note: We have _filterSlotCandidate, but that returns an observable that would need to be awaited.
        // While from an abstract base class sense we should probably make use of that, in practice
        // this function is only used by RecipeOrchestration, and there it is only used to
        // check to see if this card matches any of our requirements.  We already do this with
        // elementStackContributes()
        // Because of this, I am choosing to ignore it here.
        let candidates = tokens.filter(
          (x) =>
            !values(assignments).includes(x) &&
            aspectsMatchRequirements(x.aspectsAndSelf, spec) &&
            elementStackContributes(x)
        );

        if (candidates.length === 0) {
          continue;
        }

        candidates = this._sortSlotAvailableStacks(
          spec,
          candidates,
          requirementKeys
        );

        // Our sorting algorithm sorts the most desirable cards to the start of the list.

        // Let's try 3 times to slot cards.  We might have out of date info so some cards
        // might not be in a valid state anymore.
        const SlotAttempts = 3;
        for (let i = 0; i < SlotAttempts; i++) {
          const candidate = candidates[i];

          // This will refresh the situation for us, so getNextUnfilledThreshold will have up to date thresholds.
          const slotSuccess = await situation.setSlotContents(
            spec.id,
            candidate
          );

          if (!slotSuccess) {
            console.warn(
              `Failed to autofill situation ${situation.id}: Slotting card ${
                candidate.id
              } into ${spec.id} failed.  Trying ${
                SlotAttempts - (i + 1)
              } more times.`
            );
            continue;
          }

          // We succeeded, so add the card's aspects to our aspectContents.
          // This lets us prevent over-adding on a particular aspect.
          aspectContents = combineAspects(
            aspectContents,
            candidate.aspectsAndSelf
          );
          assignments[spec.id] = candidate;

          break;
        }
      }

      // Old method constantly waiting on observable values.
      // let unfilledSlot: OrchestrationSlot | null = null;
      // while (
      //   (unfilledSlot =
      //     values(await firstValueFrom(this.slots$)).find(
      //       (slot) => !processedIds.includes(slot.spec.id)
      //     ) ?? null) != null
      // ) {
      //   processedIds.push(unfilledSlot.spec.id);

      //   const existingValue = await firstValueFrom(unfilledSlot.assignment$);
      //   if (existingValue) {
      //     continue;
      //   }

      //   // Leave slots blank if the recipe is fully satisfied.

      //   const candidates = await firstValueFrom(
      //     unfilledSlot.availableElementStacks$
      //   );
      //   const candidate = first(candidates);
      //   if (candidate) {
      //     await unfilledSlot.assign(candidate);
      //   }
      // }
    });
  }

  /**
   * Create a filtering observable that indicates whether the given element stack is a valid option for the given slot.
   * @param elementStack The element stack model to create a filter for
   * @param spec The slot to which the element stack is being proposed
   */
  protected _createSlotCandidateFilter(
    elementStack: ElementStackModel,
    spec: SphereSpec
  ): Observable<boolean> {
    return True$;
  }

  /**
   * Gets a numerical weight for how important an element stack is for a slot.
   * @param elementStack The elementStack to determine the weight for.
   * @param spec The slot the elementStack is being proposed for.
   * @returns A numerical weight for the stack.  Higher numbers mean more importance.
   */
  protected _slotCandidateWeight(
    elementStack: ElementStackModel,
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
          this._createSlotCandidateFilter(item, spec)
        ),
        filterItemObservations((item) =>
          item.aspects$.pipe(
            map((aspects) => aspectsMatchRequirements(aspects, spec))
          )
        )
      ),
      this.slotAssignments$,
    ]).pipe(
      switchMap(([stacks, assignments]) =>
        this.requirements$.pipe(
          map((requirements) => {
            const assignedCards = Object.values(assignments).filter(isNotNull);
            const requiredAspects = Object.keys(requirements);

            // Remove all cards already assigned (note, this will remove our own assignment, we will re-add)
            stacks = stacks.filter((x) => !assignedCards.includes(x));
            // Force include the currently assigned value, so it can show up in the list even if its not a valid candidate according to our current recipe
            // This is because we may open up a verb already prepopulated.
            const ownValue = assignments[spec.id];
            if (ownValue) {
              stacks.push(ownValue);
            }

            return this._sortSlotAvailableStacks(spec, stacks, requiredAspects);
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
      assign: (element) => this._assignSlot(spec, element),
    };
  }

  private _sortSlotAvailableStacks(
    spec: SphereSpec,
    stacks: ElementStackModel[],
    requiredAspects: string[]
  ): ElementStackModel[] {
    return sortBy(stacks, [
      (stack) => this._slotCandidateWeight(stack, spec),
      (stack) => aspectsMagnitude(pick(stack.aspects, requiredAspects)),
      (stack) => aspectsMagnitude(stack.aspects),
    ]).reverse();
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
