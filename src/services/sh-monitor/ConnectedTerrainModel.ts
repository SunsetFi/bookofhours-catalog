import { BehaviorSubject, Observable, map } from "rxjs";
import { ConnectedTerrain } from "secrethistories-api";

import { TokenModel } from "./TokenModel";

export function isConnectedTerrainModel(
  model: TokenModel
): model is ConnectedTerrainModel {
  return model instanceof ConnectedTerrainModel;
}

export class ConnectedTerrainModel extends TokenModel {
  private readonly _connectedTerrain$: BehaviorSubject<ConnectedTerrain>;

  private readonly _label$: Observable<string>;
  private readonly _description$: Observable<string>;
  private readonly _shrouded$: Observable<boolean>;

  constructor(terrain: ConnectedTerrain) {
    super(terrain);

    this._connectedTerrain$ = new BehaviorSubject(terrain);

    this._label$ = this._connectedTerrain$.pipe(map((t) => t.label));
    this._description$ = this._connectedTerrain$.pipe(
      map((t) => t.description)
    );
    this._shrouded$ = this._connectedTerrain$.pipe(map((t) => t.shrouded));
  }

  get id() {
    // Game engine is inconsistent about whether it includes the ! or not.
    if (!this._connectedTerrain$.value.id.startsWith("!")) {
      return "!" + this._connectedTerrain$.value.id;
    }

    return this._connectedTerrain$.value.id;
  }

  get path() {
    return this._connectedTerrain$.value.path;
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
    this._connectedTerrain$.next(terrain);
  }
}
