import { BehaviorSubject, Observable, distinctUntilChanged, map } from "rxjs";
import { ConnectedTerrain } from "secrethistories-api";

import { TokenModel } from "./TokenModel";
import { isEqual } from "lodash";

export function isConnectedTerrainModel(
  model: TokenModel
): model is ConnectedTerrainModel {
  return model instanceof ConnectedTerrainModel;
}

export class ConnectedTerrainModel extends TokenModel {
  private readonly _connectedTerrainInternal$: BehaviorSubject<ConnectedTerrain>;
  private readonly _connectedTerrain$: Observable<ConnectedTerrain>;

  private readonly _label$: Observable<string>;
  private readonly _description$: Observable<string>;
  private readonly _shrouded$: Observable<boolean>;

  constructor(terrain: ConnectedTerrain) {
    super(terrain);

    this._connectedTerrainInternal$ = new BehaviorSubject(terrain);

    this._connectedTerrain$ = this._connectedTerrainInternal$.pipe(
      distinctUntilChanged(isEqual)
    );

    this._label$ = this._connectedTerrain$.pipe(map((t) => t.label));
    this._description$ = this._connectedTerrain$.pipe(
      map((t) => t.description)
    );
    this._shrouded$ = this._connectedTerrain$.pipe(map((t) => t.shrouded));
  }

  get id() {
    // Game engine is inconsistent about whether it includes the ! or not.
    if (!this._connectedTerrainInternal$.value.id.startsWith("!")) {
      return "!" + this._connectedTerrainInternal$.value.id;
    }

    return this._connectedTerrainInternal$.value.id;
  }

  get path() {
    return this._connectedTerrainInternal$.value.path;
  }

  get label$() {
    return this._label$;
  }

  get description$() {
    return this._description$;
  }

  get shrouded$() {
    return this._shrouded$;
  }

  _onUpdate(terrain: ConnectedTerrain) {
    this._connectedTerrainInternal$.next(terrain);
  }
}
