import { Aspects, WisdomNodeTerrain } from "secrethistories-api";
import {
  Observable,
  distinctUntilChanged,
  firstValueFrom,
  map,
  shareReplay,
} from "rxjs";
import { first } from "lodash";

import { Null$, True$, filterItems, switchMapIfNotNull } from "@/observables";

import { API } from "@/services/sh-api";
import { Compendium, RecipeModel } from "@/services/sh-compendium";
import { BatchingScheduler } from "@/services/scheduler";

import { filterTokenInPath } from "../observables";

import { TokenModel } from "./TokenModel";
import { ConnectedTerrainModel } from "./ConnectedTerrainModel";
import { ElementStackModel, isElementStackModel } from "./ElementStackModel";

export class WisdomNodeTerrainModel extends TokenModel<WisdomNodeTerrain> {
  constructor(
    token: WisdomNodeTerrain,
    api: API,
    private readonly _allTokens$: Observable<readonly TokenModel[]>,
    private readonly _compendium: Compendium,
    private readonly _scheduler: BatchingScheduler,
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
        distinctUntilChanged(),
        shareReplay(1),
      );
    }

    return this._label$;
  }

  private _description$: Observable<string | null> | null = null;
  get description$(): Observable<string | null> {
    if (!this._description$) {
      this._description$ = this.wisdomRecipe$.pipe(
        switchMapIfNotNull((t) => t.description$),
        distinctUntilChanged(),
        shareReplay(1),
      );
    }

    return this._description$;
  }

  private _shrouded$: Observable<boolean> | null = null;
  get shrouded$() {
    if (!this._shrouded$) {
      this._shrouded$ = this._token$.pipe(
        map((t) => t.shrouded),
        shareReplay(1),
      );
    }
    return this._shrouded$;
  }

  private _sealed$: Observable<boolean> | null = null;
  get sealed$() {
    if (!this._sealed$) {
      this._sealed$ = this._token$.pipe(
        map((t) => t.sealed),
        shareReplay(1),
      );
    }
    return this._sealed$;
  }

  private _requirements$: Observable<Aspects> | null = null;
  get requirements$() {
    if (!this._requirements$) {
      this._requirements$ = this._token$.pipe(
        map((t) => t.wisdomSkillRequirements),
        shareReplay(1),
      );
    }
    return this._requirements$;
  }

  private _essentials$: Observable<Aspects> | null = null;
  get essentials$() {
    if (!this._essentials$) {
      this._essentials$ = this._token$.pipe(
        map((t) => t.wisdomSkillEssentials),
        shareReplay(1),
      );
    }
    return this._essentials$;
  }

  private _forbiddens$: Observable<Aspects> | null = null;
  get forbiddens$() {
    if (!this._forbiddens$) {
      this._forbiddens$ = this._token$.pipe(
        map((t) => t.wisdomSkillForbiddens),
        shareReplay(1),
      );
    }
    return this._forbiddens$;
  }

  private _input$: Observable<ElementStackModel | null> | null = null;
  get input$() {
    if (!this._input$) {
      this._input$ = this._allTokens$.pipe(
        filterTokenInPath(`${this._token.path}/input`),
        filterItems(isElementStackModel),
        map((tokens) => first(tokens) ?? null),
        distinctUntilChanged(),
        shareReplay(1),
      );
    }

    return this._input$;
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
        distinctUntilChanged(),
        shareReplay(1),
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
            : null,
        ),
        distinctUntilChanged(),
        shareReplay(1),
      );
    }

    return this._wisdomRecipe$;
  }

  async slotInput(elementStack: ElementStackModel): Promise<boolean> {
    return this._scheduler.batchUpdate(async () => {
      try {
        const currentToken = await firstValueFrom(this.input$);
        await this._api.evictTokenAtPath(`${this._token.path}/input`);
        await elementStack.moveToSphere(`${this._token.path}/input`);

        const refreshers: Promise<void>[] = [this.refresh()];
        if (currentToken) {
          refreshers.push(currentToken.refresh());
        }
        await Promise.all(refreshers);
        return true;
      } catch (e) {
        console.warn("Failed to slot wisdom tree node input", e);
        return false;
      }
    });
  }

  async dump(): Promise<void> {
    return this._scheduler.batchUpdate(async () => {
      this._api.evictTokenAtPath(`${this._token.path}/input`);
    });
  }

  async commit(): Promise<boolean> {
    if (this._token.committed) {
      return false;
    }

    const input = await firstValueFrom(this.input$);
    if (!input) {
      return false;
    }

    return this._scheduler.batchUpdate(async () => {
      try {
        await this._api.executeTokenAtPath(this.path);
        await this._api.evictTokensAtPath(`${this.path}/output`);
        await Promise.all([input.refresh(), this.refresh()]);
        return true;
      } catch (e) {
        console.warn("Failed to commit wisdom tree node", e);
        return false;
      }
    });
  }
}

export function isWisdomNodeTerrainModel(
  token: TokenModel,
): token is WisdomNodeTerrainModel {
  return token instanceof WisdomNodeTerrainModel;
}
