import {
  BehaviorSubject,
  Observable,
  distinctUntilChanged,
  map,
  shareReplay,
} from "rxjs";
import { Token, SpaceOccupation } from "secrethistories-api";

import { API } from "@/services/sh-api";

import type { ConnectedTerrainModel } from "./ConnectedTerrainModel";

export abstract class TokenModel {
  private readonly _id: string;
  private readonly _payloadType: Token["payloadType"];

  private readonly _token$: BehaviorSubject<Token>;
  private readonly _retired$ = new BehaviorSubject<boolean>(false);

  private _lastUpdate: number = 0;

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

  get retired$(): Observable<boolean> {
    return this._retired$;
  }

  get retired() {
    return this._retired$.value;
  }

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

  get spherePath() {
    return this._token$.value.spherePath;
  }

  private _inExteriorSphere$: Observable<boolean> | null = null;
  get inExteriorSphere$() {
    if (!this._inExteriorSphere$) {
      this._inExteriorSphere$ = this._token$.pipe(
        map((token) => token.inExteriorSphere),
        distinctUntilChanged(),
        shareReplay(1)
      );
    }

    return this._inExteriorSphere$;
  }

  private _occupiesSpaceAs$: Observable<SpaceOccupation | null> | null = null;
  get occupiesSpaceAs$() {
    if (!this._occupiesSpaceAs$) {
      this._occupiesSpaceAs$ = this._token$.pipe(
        map((t) => t.occupiesSpaceAs),
        distinctUntilChanged(),
        shareReplay(1)
      );
    }

    return this._occupiesSpaceAs$;
  }

  get occupiesSpaceAs() {
    return this._token$.value.occupiesSpaceAs;
  }

  protected get _token(): Token {
    return this._token$.value;
  }

  focus() {
    this._api.focusTokenAtPath(this.path);
  }

  async refresh(): Promise<void> {
    if (this._retired$.value) {
      console.warn("Skipping token refresh as it was already retired.");
      return;
    }

    const thisUpdate = Date.now();
    const token = await this._api.getTokenById(this.id);
    const time = Date.now() - thisUpdate;

    // FIXME: We do not buffer changes across async calls, so we often get 'lag' appearing here
    // as a result of rerenders triggered by previous calls.
    // We may want to make a 'valve' like system to withhold updates in batch.
    if (time > 100) {
      console.warn(
        "Token id",
        this.id,
        "refresh took",
        Date.now() - thisUpdate,
        "ms"
      );
    }

    if (!token) {
      this._retire();
    } else {
      this._update(token, thisUpdate);
    }
  }

  _update(token: Token, timestamp: number) {
    if (this._retired$.value) {
      console.warn("Skipping token update as it was already retired.");
      return;
    }

    if (this._lastUpdate > timestamp) {
      console.warn(
        "Skipping token update as a more recent update took its place."
      );
      return;
    }
    this._lastUpdate = timestamp;

    const start = Date.now();
    this._token$.next(token);
    this._onUpdate(token);
  }

  _retire() {
    this._retired$.next(true);
  }

  protected abstract _onUpdate(token: Token): void;
}
