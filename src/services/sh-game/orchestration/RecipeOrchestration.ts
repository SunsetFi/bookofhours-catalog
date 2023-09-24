import {
  BehaviorSubject,
  Observable,
  combineLatest,
  firstValueFrom,
  map,
  of as observableOf,
  shareReplay,
} from "rxjs";

import { workstationFilterAspects } from "@/aspects";

import { RecipeModel } from "@/services/sh-compendium";

import { GameModel } from "../GameModel";

import { ElementStackModel } from "../token-models/ElementStackModel";
import { SituationModel } from "../token-models/SituationModel";

import {
  OrchestrationBase,
  OrchestrationSlot,
  OrchestrationSolution,
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

  constructor(
    private readonly _recipe: RecipeModel,
    private readonly _gameModel: GameModel
  ) {}

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
        this._gameModel.unlockedWorkstations$,
        this._aspectsFilter$,
      ]).pipe(
        map(([workstations, aspectsFilter]) =>
          workstations.filter((ws) =>
            this._situationIsAvailable(ws, aspectsFilter)
          )
        ),
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
      this._slots$ = combineLatest([
        this._situation$,
        this._slotAssignments$,
      ]).pipe(
        map(([situation, assignments]) => {
          const result: Record<string, OrchestrationSlot> = {};
          if (!situation) {
            return result;
          }

          for (const threshold of situation.thresholds) {
            result[threshold.id] = {
              spec: threshold,
              assignment: assignments[threshold.id] ?? null,
            };
          }

          return result;
        }),
        shareReplay(1)
      );
    }

    return this._slots$;
  }

  private _solution$: Observable<null | OrchestrationSolution> | null = null;
  get solution$(): Observable<null | OrchestrationSolution> {
    if (!this._solution$) {
      this._solution$ = combineLatest([
        this._situation$,
        this._slotAssignments$,
      ]).pipe(
        map(([situation, assignments]) => {
          if (!situation) {
            return null;
          }

          const slotTargetsByPath: Record<string, string> = {};
          for (const threshold of situation.thresholds) {
            const assignment = assignments[threshold.id];
            if (!assignment) {
              return null;
            }

            slotTargetsByPath[threshold.id] = assignment.path;
          }

          return {
            recipeId: this._recipe.id,
            situationPath: situation.path,
            slotTargetsByPath,
          };
        }),
        shareReplay(1)
      );
    }

    return this._solution$;
  }

  setAspectsFilter(aspects: readonly string[]): void {
    this._aspectsFilter$.next(aspects);
    this._tryClearSituation();
  }

  selectSituation(situation: SituationModel | null): void {
    this._situation$.next(situation);

    // TODO: Try to keep the same cards and reassign them to other slots.
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

    const filter = await firstValueFrom(this._aspectsFilter$);
    if (!this._situationIsAvailable(this._situation$.value, filter)) {
      this._situation$.next(null);
    }
  }

  private _situationIsAvailable(
    situation: SituationModel,
    aspectsFilter: readonly string[]
  ): boolean {
    const requiredAspects = [
      ...aspectsFilter,
      ...Object.keys(this._recipe.requirements).filter((x) =>
        workstationFilterAspects.includes(x)
      ),
    ];

    if (this._recipe.actionId) {
      if (this._recipe.actionId?.endsWith("*")) {
        const partial = this._recipe.actionId.slice(0, -1);
        if (!situation.verbId.startsWith(partial)) {
          return false;
        }
      } else if (situation.verbId != this._recipe.actionId) {
        return false;
      }
    }

    for (const aspect of requiredAspects) {
      if (
        !situation.thresholds.some(
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
