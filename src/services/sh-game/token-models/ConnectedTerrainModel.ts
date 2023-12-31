import {
  BehaviorSubject,
  Observable,
  combineLatest,
  distinctUntilChanged,
  map,
  shareReplay,
} from "rxjs";
import { Aspects, ConnectedTerrain } from "secrethistories-api";
import { isEqual } from "lodash";

import { filterItemObservations } from "@/observables";

import { API } from "@/services/sh-api";
import { RecipeModel } from "@/services/sh-compendium";

import { TokenModel } from "./TokenModel";
import { ElementStackModel } from "./ElementStackModel";

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

  private readonly _childTokens$: Observable<readonly TokenModel[]>;

  constructor(
    terrain: ConnectedTerrain,
    api: API,
    private readonly _infoRecipe: RecipeModel,
    visibleTokens$: Observable<readonly TokenModel[]>
  ) {
    super(terrain, api);

    this._connectedTerrainInternal$ = new BehaviorSubject(terrain);

    this._connectedTerrain$ = this._connectedTerrainInternal$.pipe(
      distinctUntilChanged(isEqual)
    );

    this._childTokens$ = visibleTokens$.pipe(
      // Thankfully, terrains never move, so we don't have to observe our own path here.
      filterItemObservations((token) =>
        token.path$.pipe(map((tokenPath) => tokenPath.startsWith(this.path)))
      ),
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
      this._description$ = combineLatest([
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

  private _unlockEssentials$: Observable<Aspects> | null = null;
  get unlockEssentials$() {
    if (!this._unlockEssentials$) {
      this._unlockEssentials$ = this._connectedTerrain$.pipe(
        map((t) => t.unlockEssentials),
        distinctUntilChanged(isEqual),
        shareReplay(1)
      );
    }

    return this._unlockEssentials$;
  }

  private _unlockRequirements$: Observable<Aspects> | null = null;
  get unlockRequirements$() {
    if (!this._unlockRequirements$) {
      this._unlockRequirements$ = this._connectedTerrain$.pipe(
        map((t) => t.unlockRequirements),
        distinctUntilChanged(isEqual),
        shareReplay(1)
      );
    }

    return this._unlockRequirements$;
  }

  private _unlockForbiddens$: Observable<Aspects> | null = null;
  get unlockForbiddens$() {
    if (!this._unlockForbiddens$) {
      this._unlockForbiddens$ = this._connectedTerrain$.pipe(
        map((t) => t.unlockForbiddens),
        distinctUntilChanged(isEqual),
        shareReplay(1)
      );
    }

    return this._unlockForbiddens$;
  }

  get children$() {
    return this._childTokens$;
  }

  openTerrainWindow() {
    if (
      this._connectedTerrainInternal$.value.sealed ||
      !this._connectedTerrainInternal$.value.shrouded
    ) {
      return false;
    }

    try {
      this._api.openTokenAtPath(this.path);
    } catch {
      return false;
    }

    return true;
  }

  async unlockTerrain(input: ElementStackModel) {
    if (!this.openTerrainWindow()) {
      return false;
    }

    if (!(await input.moveToSphere(`~/terraindetailinputsphere`))) {
      return false;
    }

    try {
      await this._api.executeTokenAtPath(this.path);
    } catch {
      return false;
    }

    return true;
  }

  _onUpdate(terrain: ConnectedTerrain) {
    this._connectedTerrainInternal$.next(terrain);
  }
}
