import {
  BehaviorSubject,
  Observable,
  Subscription,
  bufferCount,
  combineLatest,
  debounceTime,
  firstValueFrom,
  map,
  of,
  shareReplay,
  startWith,
  switchMap,
} from "rxjs";
import {
  Aspects,
  SituationState,
  SphereSpec,
  Verb,
  actionIdMatches,
  aspectsMatchSphereSpec,
} from "secrethistories-api";
import { difference, pick } from "lodash";

import { switchMapIfNotNull, observeAllMap } from "@/observables";

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

interface ElementSlotsData {
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

  private readonly _applyDefaultsSubscription: Subscription;

  private readonly _situationVerb$: Observable<Verb | null>;

  constructor(
    private readonly _recipe: RecipeModel,
    private readonly desiredElements: readonly ElementModel[],
    compendium: Compendium,
    tokensSource: TokensSource,
    private readonly _orchestrationFactory: OrchestrationFactory,
    private readonly _replaceOrchestration: (
      orchestration: Orchestration | null
    ) => void
  ) {
    super(tokensSource);

    this._situationVerb$ = this._situation$.pipe(
      switchMapIfNotNull((situation) =>
        compendium.getVerbById(situation.verbId)
      )
    );

    const desiredElementThresholds$ = of(desiredElements).pipe(
      observeAllMap((element) =>
        combineLatest([element.aspects$, element.slots$]).pipe(
          map(([aspects, slots]) => ({ element, aspects, slots }))
        )
      ),
      shareReplay(1)
    );

    this._availableSituations$ = combineLatest([
      this._tokensSource.visibleSituations$,
      desiredElementThresholds$,
    ]).pipe(
      map(([situations, elementThresholds]) => {
        return situations.filter((situation) =>
          this._situationIsAvailable(situation, elementThresholds)
        );
      }),
      shareReplay(1)
    );

    // Select a default situation.
    firstValueFrom(this.availableSituations$).then((situations) => {
      const situation = situations.find((x) => x.state === "Unstarted");
      if (!situation) {
        return;
      }

      this._situation$.next(situation);
    });

    // Pick defaults when things have settled down.
    // This used to be straightforward when we precomputed slots, but now
    // we have to wait for the game to catch up and update us on the slot count.
    this._applyDefaultsSubscription = this.slots$
      .pipe(
        startWith({} as Readonly<Record<string, OrchestrationSlot>>),
        bufferCount(2, 1)
      )
      .subscribe(([oldSlots, newSlots]) => {
        // Only apply defaults to new slots.
        const oldKeys = Object.keys(oldSlots);
        const newKeys = Object.keys(newSlots);
        const added = difference(newKeys, oldKeys);
        this._pickDefaults(Object.values(pick(newSlots, added)));
      });
  }

  _onSituationStateUpdated(situationState: SituationState): void {
    if (situationState !== "Unstarted" && this._situation$.value != null) {
      this._situation$.next(null);
    }
  }

  _dispose() {
    this._situation$.value?.close();
    this._applyDefaultsSubscription.unsubscribe();
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

  private _situationIsAvailable(
    situation: SituationModel,
    elementSlotsData: ElementSlotsData[]
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

    for (const { element, aspects, slots } of elementSlotsData) {
      // As far as I can tell from the game code, only elements slotted into verb thresholds (situation thresholds in our case)
      // can provide slots
      if (
        situation.thresholds.some((t) => aspectsMatchSphereSpec(aspects, t))
      ) {
        thresholds.push(...slots);
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
          this.desiredElements.find(
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
  }
}
