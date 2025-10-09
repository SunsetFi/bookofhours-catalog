import {
  BehaviorSubject,
  Observable,
  distinctUntilChanged,
  map,
  shareReplay,
} from "rxjs";
import { Token, SpaceOccupation } from "secrethistories-api";
import { isEqual } from "lodash";

import { API } from "@/services/sh-api";

import type { ConnectedTerrainModel } from "./ConnectedTerrainModel";

export abstract class TokenModel<T extends Token = any> {
  private readonly _payloadType: Token["payloadType"];

  private readonly _tokenSubject$: BehaviorSubject<T>;
  private readonly _retired$ = new BehaviorSubject<boolean>(false);

  private _lastUpdate: number = 0;

  constructor(
    token: T,
    protected readonly _api: API,
  ) {
    this._payloadType = token.payloadType;
    this._tokenSubject$ = new BehaviorSubject(token);
  }

  get id() {
    let id = this._token.id;

    // Game engine is inconsistent about whether it includes the ! or not.
    if (!id.startsWith("!")) {
      id = "!" + id;
    }

    return id;
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
        shareReplay(1),
      );
    }

    return this._path$;
  }

  get path() {
    return this._token.path;
  }

  get spherePath() {
    return this._token.spherePath;
  }

  private _inExteriorSphere$: Observable<boolean> | null = null;
  get inExteriorSphere$() {
    if (!this._inExteriorSphere$) {
      this._inExteriorSphere$ = this._token$.pipe(
        map((token) => token.inExteriorSphere),
        distinctUntilChanged(),
        shareReplay(1),
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
        shareReplay(1),
      );
    }

    return this._occupiesSpaceAs$;
  }

  get occupiesSpaceAs() {
    return this._token.occupiesSpaceAs;
  }

  protected get _token(): T {
    return this._tokenSubject$.value;
  }

  protected get _token$(): Observable<T> {
    return this._tokenSubject$;
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

    // Note: If this picks up lag, it might be the result of multiple simultanious token updates.
    // This isn't a network issue, but rather other token updates are publishing their new values, triggering react
    // re-renders, eating up time before we get to process this update.
    // If this starts getting hit again, look for areas that might need a BatchingScheduler.batchUpdate() call.
    if (time > 100) {
      console.warn(
        "Token id",
        this.id,
        "refresh took",
        Date.now() - thisUpdate,
        "ms",
      );
    }

    if (!token) {
      this._retire();
    } else {
      this._update(token as T, thisUpdate);
    }
  }

  _update(token: T, timestamp: number) {
    if (this._retired$.value) {
      console.warn("Skipping token update as it was already retired.");
      return;
    }

    if (this._lastUpdate > timestamp) {
      console.warn(
        "Skipping token update as a more recent update took its place.",
      );
      return;
    }
    this._lastUpdate = timestamp;

    // Make sure we actually have new data, as pushing a value to the subject will cause
    // recomputations and rerenders even if nothing has changed.
    // We try to guard against this with distinctUntilChanged(), but it's best to just not.
    if (isEqual(this._tokenSubject$.value, token)) {
      return;
    }

    this._tokenSubject$.next(token);
  }

  _retire() {
    this._retired$.next(true);
  }
}
