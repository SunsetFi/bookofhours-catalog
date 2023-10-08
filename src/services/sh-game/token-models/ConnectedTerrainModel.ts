import {
  BehaviorSubject,
  Observable,
  distinctUntilChanged,
  map,
  shareReplay,
} from "rxjs";
import { ConnectedTerrain } from "secrethistories-api";
import { isEqual } from "lodash";

import { API } from "@/services/sh-api";

import { TokenModel } from "./TokenModel";

export function isConnectedTerrainModel(
  model: TokenModel
): model is ConnectedTerrainModel {
  return model instanceof ConnectedTerrainModel;
}

const nullTerrain = new BehaviorSubject<ConnectedTerrainModel | null>(
  null
).asObservable();

export class ConnectedTerrainModel extends TokenModel {
  private readonly _connectedTerrainInternal$: BehaviorSubject<ConnectedTerrain>;
  private readonly _connectedTerrain$: Observable<ConnectedTerrain>;

  private readonly _label$: Observable<string>;
  private readonly _description$: Observable<string>;

  constructor(terrain: ConnectedTerrain, api: API) {
    super(terrain, api);

    this._connectedTerrainInternal$ = new BehaviorSubject(terrain);

    this._connectedTerrain$ = this._connectedTerrainInternal$.pipe(
      distinctUntilChanged(isEqual)
    );

    this._label$ = this._connectedTerrain$.pipe(map((t) => t.label));
    this._description$ = this._connectedTerrain$.pipe(
      map((t) => t.description),
      shareReplay(1)
    );
    this._shrouded$ = this._connectedTerrain$.pipe(
      map((t) => t.shrouded),
      shareReplay(1)
    );
  }

  get id() {
    // Game engine is inconsistent about whether it includes the ! or not.
    if (!this._connectedTerrainInternal$.value.id.startsWith("!")) {
      return "!" + this._connectedTerrainInternal$.value.id;
    }

    return this._connectedTerrainInternal$.value.id;
  }

  get label$() {
    return this._label$;
  }

  get description$() {
    return this._description$;
  }

  private _visible$: Observable<boolean> | null = null;
  get visible$() {
    if (!this._visible$) {
      this._visible$ = this._connectedTerrain$.pipe(
        map((t) => !t.shrouded),
        shareReplay(1)
      );
    }
    return this._visible$;
  }

  get parentTerrain$() {
    return nullTerrain;
  }

  private _sealed$: Observable<boolean> | null = null;
  get sealed$() {
    if (!this._sealed$) {
      this._sealed$ = this._connectedTerrain$.pipe(
        map((t) => t.sealed),
        shareReplay(1)
      );
    }
    return this._sealed$;
  }

  private _shrouded$: Observable<boolean> | null = null;
  get shrouded$() {
    if (!this._shrouded$) {
      this._shrouded$ = this._connectedTerrain$.pipe(
        map((t) => t.shrouded),
        shareReplay(1)
      );
    }
    return this._shrouded$;
  }

  _onUpdate(terrain: ConnectedTerrain) {
    this._connectedTerrainInternal$.next(terrain);
  }
}
