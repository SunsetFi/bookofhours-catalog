import { BehaviorSubject, Observable, map, shareReplay } from "rxjs";
import { Aspects } from "secrethistories-api";

import { Compendium, RecipeModel } from "@/services/sh-compendium";

import { SituationModel } from "../token-models/SituationModel";

import {
  NoteContainingOrchestration,
  OrchestrationBase,
  OrchestrationSlot,
} from "./types";

export class OngoingSituationOrchestration
  implements OrchestrationBase, NoteContainingOrchestration
{
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

  private _requirements$: Observable<Readonly<Aspects>> | null = null;
  get requirements$(): Observable<Readonly<Aspects>> {
    if (!this._requirements$) {
      this._requirements$ = new BehaviorSubject({});
    }

    return this._requirements$;
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

  get notes$() {
    return this._situation.notes$;
  }

  private _slots$: Observable<
    Readonly<Record<string, OrchestrationSlot>>
  > | null = null;
  get slots$(): Observable<Readonly<Record<string, OrchestrationSlot>>> {
    if (!this._slots$) {
      // TODO: Ongoing slots
      this._slots$ = new BehaviorSubject({});
    }

    return this._slots$;
  }

  private _aspects$: Observable<Readonly<Record<string, number>>> | null = null;
  get aspects$(): Observable<Readonly<Record<string, number>>> {
    if (!this._aspects$) {
      // TODO: Ongoing aspects
      this._aspects$ = new BehaviorSubject({});
    }

    return this._aspects$;
  }
}
