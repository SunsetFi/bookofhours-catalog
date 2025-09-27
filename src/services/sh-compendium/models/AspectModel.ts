import { Element } from "secrethistories-api";
import { BehaviorSubject, Observable, map } from "rxjs";

import { promiseFuncToObservable } from "@/observables";

import { API } from "../../sh-api";

export class AspectModel {
  private readonly _element$: Observable<Element | null>;

  constructor(
    private readonly _aspectId: string,
    resolve: (id: string) => Promise<Element | null>,
    private readonly _api: API,
  ) {
    this._element$ = promiseFuncToObservable(() => resolve(_aspectId));
  }

  get aspectId() {
    return this._aspectId;
  }

  private _exists$: Observable<boolean> | null = null;
  get exists$() {
    if (this._exists$ == null) {
      this._exists$ = this._element$.pipe(map((e) => e != null));
    }

    return this._exists$;
  }

  private _hidden$: Observable<boolean> | null = null;
  get hidden$() {
    if (this._hidden$ == null) {
      this._hidden$ = this._element$.pipe(map((e) => e?.isHidden ?? false));
    }

    return this._hidden$;
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
        map((e) => e?.description ?? null),
      );
    }

    return this._description$;
  }

  private _iconUrl$: Observable<string> | null = null;
  get iconUrl$() {
    if (!this._iconUrl$) {
      this._iconUrl$ = new BehaviorSubject(
        `${this._api.baseUrl}/api/compendium/elements/${this.aspectId}/icon.png`,
      );
    }

    return this._iconUrl$;
  }
}
