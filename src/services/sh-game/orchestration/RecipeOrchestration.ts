import {
  BehaviorSubject,
  Observable,
  Subscription,
  combineLatest,
  debounceTime,
  firstValueFrom,
  map,
  of as observableOf,
  shareReplay,
} from "rxjs";
import { Aspects, SphereSpec, actionIdMatches } from "secrethistories-api";
import { flatten } from "lodash";

import { switchMapIfNotNull, observeAll } from "@/observables";
import { workstationFilterAspects } from "@/aspects";

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

  private readonly _slotAssignments$ = new BehaviorSubject<
    Readonly<Record<string, ElementStackModel | null>>
  >({});

  // Hack: Our elements have slots as well.  We need to take that into account when
  // choosing available situations.
  // This will observe all slots added by our desiredElements, and use them in our
  // available situations check to see if that situation can have these slots.
  // This is here entirely for "consider", particularly for considering skills.
  private readonly _desiredElementThresholds$: Observable<SphereSpec[]>;

  private readonly _subscription: Subscription;

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

    this._subscription = this.slots$
      .pipe(debounceTime(5))
      .subscribe((slots) => {
        this._pickDefaults(Object.values(slots));
      });
  }

  _dispose() {
    this._subscription.unsubscribe();
  }

  get label$(): Observable<string | null> {
    return this._recipe.label$;
  }

  private _recipe$: Observable<RecipeModel | null> | null = null;
  get recipe$(): Observable<RecipeModel | null> {
    if (!this._recipe$) {
      this._recipe$ = observableOf(this._recipe).pipe(shareReplay(1));
    }

    return this._recipe$;
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

  private _startDescription$: Observable<string> | null = null;
  get startDescription$(): Observable<string> {
    if (!this._startDescription$) {
      this._startDescription$ = combineLatest([
        this._situation$.pipe(
          switchMapIfNotNull((situation) => situation?.verbId$),
          switchMapIfNotNull((verbId) => this._compendium.getVerbById(verbId))
        ),
        this._recipe.description$,
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

    return this._startDescription$;
  }

  private _availableSituations$: Observable<readonly SituationModel[]> | null =
    null;
  get availableSituations$(): Observable<readonly SituationModel[]> {
    if (!this._availableSituations$) {
      this._availableSituations$ = combineLatest([
        this._tokensSource.fixedSituations$.pipe(
          map((situations) =>
            situations.find((situation) => situation.verbId === "consider")
          )
        ),
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

  protected get slotAssignments$(): Observable<
    Readonly<Record<string, ElementStackModel | null>>
  > {
    return this._slotAssignments$;
  }

  selectSituation(situation: SituationModel | null): void {
    this._situation$.next(situation);
    this._slotAssignments$.next({});
  }

  async prepare() {
    const [situation, slots] = await Promise.all([
      firstValueFrom(this._situation$),
      firstValueFrom(this._slotAssignments$),
    ]);

    if (!situation || !slots) {
      return false;
    }

    var success = true;
    try {
      // hack: Don't do this for fixedVerbs, they aren't focusable.
      // FIXME: Put this into the api mod logic.
      if (!situation.path.startsWith("~/fixedVerbs")) {
        situation.focus();
      }

      situation.open();

      for (const slotId of Object.keys(slots)) {
        var token = slots[slotId];
        try {
          situation.setSlotContents(slotId, token);
        } catch (e) {
          console.error(
            "Failed to slot",
            token?.id ?? "<clear>",
            "to",
            slotId,
            "of situation",
            situation.id,
            e
          );
          success = false;
        }
      }

      if (!(await situation.setRecipe(this._recipe.recipeId))) {
        success = false;
      }
    } catch (e) {
      success = false;
    }

    return success;
  }

  async execute() {
    if (!(await this.prepare())) {
      return false;
    }

    const situation = await firstValueFrom(this._situation$);
    if (!situation) {
      return false;
    }

    try {
      await situation.execute();

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

  protected _assignSlot(
    spec: SphereSpec,
    element: ElementStackModel | null
  ): void {
    const assignments = { ...this._slotAssignments$.value };
    assignments[spec.id] = element;
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

  private async _pickDefaults(slots: OrchestrationSlot[]) {
    // Maybe we should recalculate all of these from the current values, but these should all be warmed up and ready.
    let options = await Promise.all(
      slots.map((slot) =>
        firstValueFrom(slot.availableElementStacks$).then(
          (stacks) => [slot, stacks] as const
        )
      )
    );

    const assignments = { ...this._slotAssignments$.value };
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

    this._slotAssignments$.next(assignments);
  }
}
