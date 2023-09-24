import { Aspects, Recipe, SphereSpec } from "secrethistories-api";
import { Observable, map } from "rxjs";

import { promiseFuncToObservable } from "@/observables";

import {
  ModelWithAspects,
  ModelWithDescription,
  ModelWithLabel,
} from "../../sh-game";

export class RecipeModel
  implements ModelWithLabel, ModelWithDescription, ModelWithAspects
{
  private readonly _recipe$: Observable<Recipe | null>;
  private _recipe: Recipe | null = null;

  constructor(
    private readonly _id: string,
    resolve: (id: string) => Promise<Recipe | null>
  ) {
    this._recipe$ = promiseFuncToObservable(async () => {
      this._recipe = await resolve(_id);
      return this._recipe;
    });
  }

  get id() {
    return this._id;
  }

  private _exists$: Observable<boolean> | null = null;
  get exists$() {
    if (this._exists$ == null) {
      this._exists$ = this._recipe$.pipe(map((e) => e != null));
    }

    return this._exists$;
  }

  private _actionId$: Observable<string | null> | null = null;
  get actionId$() {
    if (this._actionId$ == null) {
      this._actionId$ = this._recipe$.pipe(map((e) => e?.actionId ?? null));
    }

    return this._actionId$;
  }

  get actionId() {
    return this._recipe?.actionId ?? null;
  }

  private _label$: Observable<string | null> | null = null;
  get label$() {
    if (this._label$ == null) {
      this._label$ = this._recipe$.pipe(map((e) => e?.label ?? null));
    }

    return this._label$;
  }

  private _description$: Observable<string | null> | null = null;
  get description$() {
    if (this._description$ == null) {
      this._description$ = this._recipe$.pipe(
        map((e) => e?.description ?? null)
      );
    }

    return this._description$;
  }

  private _aspects$: Observable<Readonly<Aspects>> | null = null;
  get aspects$() {
    if (this._aspects$ == null) {
      this._aspects$ = this._recipe$.pipe(
        map((e) => Object.freeze({ ...e?.aspects }))
      );
    }

    return this._aspects$;
  }

  private _startLabel$: Observable<string | null> | null = null;
  get startLabel$() {
    if (this._startLabel$ == null) {
      this._startLabel$ = this._recipe$.pipe(map((e) => e?.startLabel ?? null));
    }

    return this._startLabel$;
  }

  private _startDescription$: Observable<string | null> | null = null;
  get startDescription$() {
    if (this._startDescription$ == null) {
      this._startDescription$ = this._recipe$.pipe(
        map((e) => e?.startDescription ?? null)
      );
    }

    return this._startDescription$;
  }

  private _preSlots$: Observable<Readonly<SphereSpec[]>> | null = null;
  get preSlots$() {
    if (this._preSlots$ == null) {
      this._preSlots$ = this._recipe$.pipe(
        map((e) => Object.freeze([...(e?.preSlots ?? [])]))
      );
    }

    return this._preSlots$;
  }

  private _slots$: Observable<Readonly<SphereSpec[]>> | null = null;
  get slots$() {
    if (this._slots$ == null) {
      this._slots$ = this._recipe$.pipe(
        map((e) => Object.freeze([...(e?.slots ?? [])]))
      );
    }

    return this._slots$;
  }

  private _warmup$: Observable<number | null> | null = null;
  get warmup$() {
    if (this._warmup$ == null) {
      this._warmup$ = this._recipe$.pipe(map((e) => e?.warmup ?? null));
    }

    return this._warmup$;
  }

  private _requirements$: Observable<Readonly<Record<string, string>>> | null =
    null;
  get requirements$() {
    if (this._requirements$ == null) {
      this._requirements$ = this._recipe$.pipe(
        map((e) => Object.freeze({ ...e?.requirements }))
      );
    }

    return this._requirements$;
  }

  get requirements() {
    return this._recipe?.requirements ?? {};
  }

  private _extantRequirements$: Observable<
    Readonly<Record<string, string>>
  > | null = null;
  get extantRequirements$() {
    if (this._extantRequirements$ == null) {
      this._extantRequirements$ = this._recipe$.pipe(
        map((e) => Object.freeze({ ...e?.extantRequirements }))
      );
    }

    return this._extantRequirements$;
  }

  private _effects$: Observable<Readonly<Record<string, string>>> | null = null;
  get effects$() {
    if (this._effects$ == null) {
      this._effects$ = this._recipe$.pipe(
        map((e) => Object.freeze({ ...e?.effects }))
      );
    }

    return this._effects$;
  }
}
