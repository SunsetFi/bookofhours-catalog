import { Aspects, Element, SphereSpec, XTrigger } from "secrethistories-api";
import { Observable, map } from "rxjs";

import { promiseFuncToObservable } from "@/observables";

import { API } from "../../sh-api";
import {
  ModelWithAspects,
  ModelWithDescription,
  ModelWithIconUrl,
  ModelWithLabel,
} from "../../sh-game";

export class ElementModel
  implements
    ModelWithLabel,
    ModelWithDescription,
    ModelWithAspects,
    ModelWithIconUrl
{
  private readonly _element$: Observable<Element | null>;

  constructor(
    private readonly _id: string,
    resolve: (id: string) => Promise<Element | null>,
    private readonly _api: API
  ) {
    this._element$ = promiseFuncToObservable(() => resolve(_id));
  }

  get elementId() {
    return this._id;
  }

  private _exists$: Observable<boolean> | null = null;
  get exists$() {
    if (this._exists$ == null) {
      this._exists$ = this._element$.pipe(map((e) => e != null));
    }

    return this._exists$;
  }

  private _isHidden$: Observable<boolean> | null = null;
  get isHidden$() {
    if (this._isHidden$ == null) {
      this._isHidden$ = this._element$.pipe(map((e) => e?.isHidden ?? false));
    }

    return this._isHidden$;
  }

  private _label$: Observable<string | null> | null = null;
  get label$() {
    if (this._label$ == null) {
      this._label$ = this._element$.pipe(map((e) => e?.label ?? null));
    }

    return this._label$;
  }

  private _description$: Observable<string | null> | null = null;
  get description$() {
    if (this._description$ == null) {
      this._description$ = this._element$.pipe(
        map((e) => e?.description ?? null)
      );
    }

    return this._description$;
  }

  get iconUrl() {
    return `${this._api.baseUrl}/api/compendium/elements/${this.elementId}/icon.png`;
  }

  private _aspects$: Observable<Readonly<Aspects>> | null = null;
  get aspects$() {
    if (this._aspects$ == null) {
      this._aspects$ = this._element$.pipe(
        map((e) => Object.freeze({ ...e?.aspects }))
      );
    }

    return this._aspects$;
  }

  private _slots$: Observable<readonly SphereSpec[]> | null = null;
  get slots$() {
    if (this._slots$ == null) {
      this._slots$ = this._element$.pipe(
        map((e) => Object.freeze([...(e?.slots ?? [])]))
      );
    }

    return this._slots$;
  }

  private _xtriggers$: Observable<Record<string, XTrigger[]>> | null = null;
  get xtriggers$() {
    if (this._xtriggers$ == null) {
      this._xtriggers$ = this._element$.pipe(
        // TODO: Deep freeze
        map((e) => Object.freeze({ ...e?.xtriggers }))
      );
    }

    return this._xtriggers$;
  }
}
