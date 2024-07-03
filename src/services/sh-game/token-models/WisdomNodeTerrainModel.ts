import { WisdomNodeTerrain } from "secrethistories-api";
import { Observable, distinctUntilChanged, map, shareReplay } from "rxjs";
import { first } from "lodash";

import { Null$, True$, filterItems, switchMapIfNotNull } from "@/observables";

import { API } from "@/services/sh-api";
import { Compendium, RecipeModel } from "@/services/sh-compendium";

import { filterTokenInPath } from "../observables";

import { TokenModel } from "./TokenModel";
import { ConnectedTerrainModel } from "./ConnectedTerrainModel";
import { ElementStackModel, isElementStackModel } from "./ElementStackModel";

export class WisdomNodeTerrainModel extends TokenModel<WisdomNodeTerrain> {
  constructor(
    token: WisdomNodeTerrain,
    api: API,
    private readonly _allTokens$: Observable<readonly TokenModel[]>,
    private readonly _compendium: Compendium
  ) {
    super(token, api);
  }

  get visible$(): Observable<boolean> {
    return True$;
  }

  get parentTerrain$(): Observable<ConnectedTerrainModel | null> {
    return Null$;
  }

  private _label$: Observable<string | null> | null = null;
  get label$(): Observable<string | null> {
    if (!this._label$) {
      this._label$ = this.wisdomRecipe$.pipe(
        switchMapIfNotNull((t) => t.label$),
        distinctUntilChanged()
      );
    }

    return this._label$;
  }

  private _description$: Observable<string | null> | null = null;
  get description$(): Observable<string | null> {
    if (!this._description$) {
      this._description$ = this.wisdomRecipe$.pipe(
        switchMapIfNotNull((t) => t.description$),
        distinctUntilChanged()
      );
    }

    return this._description$;
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

  get committed() {
    return this._token.committed;
  }

  private _committed$: Observable<ElementStackModel | null> | null = null;
  get committed$() {
    if (!this._committed$) {
      this._committed$ = this._allTokens$.pipe(
        filterTokenInPath(`${this._token.path}/commitment`),
        filterItems(isElementStackModel),
        map((tokens) => first(tokens) ?? null),
        distinctUntilChanged()
      );
    }

    return this._committed$;
  }

  private _wisdomRecipe$: Observable<RecipeModel | null> | null = null;
  get wisdomRecipe$(): Observable<RecipeModel | null> {
    if (!this._wisdomRecipe$) {
      this._wisdomRecipe$ = this._token$.pipe(
        map((t) =>
          t.wisdomRecipeId
            ? this._compendium.getRecipeById(t.wisdomRecipeId)
            : null
        ),
        distinctUntilChanged()
      );
    }

    return this._wisdomRecipe$;
  }
}

export function isWisdomNodeTerrainModel(
  token: TokenModel
): token is WisdomNodeTerrainModel {
  return token instanceof WisdomNodeTerrainModel;
}
