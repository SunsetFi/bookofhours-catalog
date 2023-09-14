import {
  BehaviorSubject,
  Observable,
  distinctUntilChanged,
  map,
  shareReplay,
} from "rxjs";
import { Token } from "secrethistories-api";

import { API } from "@/services/sh-api";

import type { ConnectedTerrainModel } from "./ConnectedTerrainModel";

export abstract class TokenModel {
  private readonly _id: string;
  private readonly _payloadType: Token["payloadType"];

  private readonly _token$: BehaviorSubject<Token>;

  constructor(token: Token, protected readonly _api: API) {
    this._id = token.id;
    this._payloadType = token.payloadType;
    this._token$ = new BehaviorSubject(token);
  }

  get id() {
    return this._id;
  }

  get payloadType() {
    return this._payloadType;
  }

  abstract get visible$(): Observable<boolean>;

  abstract get parentTerrain$(): Observable<ConnectedTerrainModel | null>;

  private _path$: Observable<string> | null = null;
  get path$() {
    if (!this._path$) {
      this._path$ = this._token$.pipe(
        map((t) => t.path),
        distinctUntilChanged(),
        shareReplay(1)
      );
    }

    return this._path$;
  }

  get path() {
    return this._token$.value.path;
  }

  focus() {
    this._api.focusTokenAtPath(this.path);
  }

  update(token: Token) {
    this._token$.next(token);
    this._onUpdate(token);
  }

  protected abstract _onUpdate(token: Token): void;
}
