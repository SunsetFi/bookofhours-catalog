import { Aspects, Recipe, SphereSpec, XTrigger } from "secrethistories-api";
import { Observable, map } from "rxjs";

import { promiseFuncToObservable } from "@/observables";

import {
  ModelWithAspects,
  ModelWithDescription,
  ModelWithLabel,
} from "../../sh-model";

export class RecipeModel
  implements ModelWithLabel, ModelWithDescription, ModelWithAspects
{
  private readonly _recipe$: Observable<Recipe | null>;

  constructor(
    private readonly _id: string,
    resolve: (id: string) => Promise<Recipe | null>
  ) {
    this._recipe$ = promiseFuncToObservable(() => resolve(_id));
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
}
