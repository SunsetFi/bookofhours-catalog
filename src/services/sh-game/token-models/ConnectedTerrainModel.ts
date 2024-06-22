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

import { API } from "@/services/sh-api";
import { RecipeModel } from "@/services/sh-compendium";

import { filterTokenInPath } from "../observables";

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

export class ConnectedTerrainModel extends TokenModel<ConnectedTerrain> {
  private readonly _childTokens$: Observable<readonly TokenModel[]>;

  constructor(
    terrain: ConnectedTerrain,
    api: API,
    private readonly _infoRecipe: RecipeModel,
    visibleTokens$: Observable<readonly TokenModel[]>
  ) {
    super(terrain, api);

    this._childTokens$ = visibleTokens$.pipe(
      // Thankfully, terrains never move, so we don't have to observe our own path here.
      filterTokenInPath(this.path),
      shareReplay(1)
    );
  }

  // Null label inherited from RecipeModel maybe not existing and returning null.
  // Messy, please fix this.
  private _label$: Observable<string | null> | null = null;
  get label$() {
    if (!this._label$) {
      this._label$ = combineLatest([
        this._token$,
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
        this._token$,
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
      this._visible$ = this._token$.pipe(
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
      this._sealed$ = this._token$.pipe(
        map((t) => t.sealed),
        shareReplay(1)
      );
    }
    return this._sealed$;
  }

  private _shrouded$: Observable<boolean> | null = null;
  get shrouded$() {
    if (!this._shrouded$) {
      this._shrouded$ = this._token$.pipe(
        map((t) => t.shrouded),
        shareReplay(1)
      );
    }
    return this._shrouded$;
  }

  private _unlockEssentials$: Observable<Aspects> | null = null;
  get unlockEssentials$() {
    if (!this._unlockEssentials$) {
      this._unlockEssentials$ = this._token$.pipe(
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
      this._unlockRequirements$ = this._token$.pipe(
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
      this._unlockForbiddens$ = this._token$.pipe(
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

  async openTerrainWindow() {
    if (this._token.sealed || !this._token.shrouded) {
      return false;
    }

    try {
      await this._api.openTokenAtPath(this.path);
    } catch (e) {
      console.warn("Failed to open terrain window", e);
      return false;
    }

    return true;
  }

  async unlockTerrain(input: ElementStackModel) {
    if (!(await this.openTerrainWindow())) {
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
}
