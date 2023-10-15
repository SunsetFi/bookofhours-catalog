import { BehaviorSubject, Observable, map, shareReplay } from "rxjs";

import { Compendium, RecipeModel } from "@/services/sh-compendium";

import { SituationModel } from "../token-models/SituationModel";

import { ExecutionPlan, OrchestrationBase, OrchestrationSlot } from "./types";

export class OngoingSituationOrchestration implements OrchestrationBase {
  constructor(
    private readonly _situation: SituationModel,
    private readonly _compendium: Compendium
  ) {}

  private _recipe$: Observable<RecipeModel | null> | null = null;
  get recipe$(): Observable<RecipeModel | null> {
    if (!this._recipe$) {
      this._recipe$ = this._situation.recipeId$.pipe(
        map((recipeId) =>
          recipeId ? this._compendium.getRecipeById(recipeId) : null
        ),
        shareReplay(1)
      );
    }

    return this._recipe$;
  }

  private _situation$: Observable<SituationModel | null> | null = null;
  get situation$(): Observable<SituationModel | null> {
    if (!this._situation$) {
      this._situation$ = new BehaviorSubject<SituationModel | null>(
        this._situation
      );
    }

    return this._situation$;
  }

  get slots$(): Observable<Readonly<Record<string, OrchestrationSlot>>> {
    throw new Error("Not implemented");
  }

  get executionPlan$(): Observable<ExecutionPlan | null> {
    throw new Error("Not implemented");
  }
}
