import {
  BehaviorSubject,
  Observable,
  combineLatest,
  distinctUntilChanged,
  map,
  shareReplay,
} from "rxjs";
import { ConnectedTerrain } from "secrethistories-api";
import { isEqual } from "lodash";

import { API } from "@/services/sh-api";
import { RecipeModel } from "@/services/sh-compendium";

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

  constructor(
    terrain: ConnectedTerrain,
    api: API,
    private readonly _infoRecipe: RecipeModel
  ) {
    super(terrain, api);

    this._connectedTerrainInternal$ = new BehaviorSubject(terrain);

    this._connectedTerrain$ = this._connectedTerrainInternal$.pipe(
      distinctUntilChanged(isEqual)
    );
  }

  get id() {
    // Game engine is inconsistent about whether it includes the ! or not.
    if (!this._connectedTerrainInternal$.value.id.startsWith("!")) {
      return "!" + this._connectedTerrainInternal$.value.id;
    }

    return this._connectedTerrainInternal$.value.id;
  }

  // Null label inherited from RecipeModel maybe not existing and returning null.
  // Messy, please fix this.
  private _label$: Observable<string | null> | null = null;
  get label$() {
    if (!this._label$) {
      this._label$ = combineLatest([
        this._connectedTerrain$,
        this._infoRecipe.startLabel$,
      ]).pipe(
        map(([terrain, infoRecipeLabel]) => {
          if (terrain.shrouded) {
            return infoRecipeLabel;
          }

          return terrain.label;
        }),
        shareReplay(1)
      );
    }

    return this._label$;
  }

  private _description$: Observable<string | null> | null = null;
  get description$() {
    if (!this._description$) {
      this._label$ = combineLatest([
        this._connectedTerrain$,
        this._infoRecipe.startDescription$,
      ]).pipe(
        map(([terrain, infoRecipeDescription]) => {
          if (terrain.shrouded) {
            return infoRecipeDescription;
          }

          return terrain.description;
        }),
        shareReplay(1)
      );
    }

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
