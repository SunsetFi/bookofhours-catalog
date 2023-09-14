import { inject, injectable, singleton } from "microinject";
import { Observable, map, shareReplay } from "rxjs";

import { Compendium, ElementModel } from "../sh-compendium";

import {
  distinctUntilShallowArrayChanged,
  filterItemObservations,
  filterItems,
} from "@/observables";

import {
  ElementStackModel,
  isElementStackModel,
} from "./token-models/ElementStackModel";
import {
  SituationModel,
  isSituationModel,
} from "./token-models/SituationModel";
import {
  ConnectedTerrainModel,
  isConnectedTerrainModel,
} from "./token-models/ConnectedTerrainModel";

import {
  RunningSource,
  CharacterSource,
  TokensSource,
  CraftablesSource,
} from "./sources";

@injectable()
@singleton()
export class GameModel {
  constructor(
    @inject(RunningSource)
    private readonly _runningSource: RunningSource,
    @inject(Compendium) private readonly _compendium: Compendium,
    @inject(CharacterSource) private readonly _characterSource: CharacterSource,
    @inject(CraftablesSource)
    private readonly _craftablesSource: CraftablesSource,
    @inject(TokensSource) private readonly _tokensSource: TokensSource
  ) {}

  get isRunning$() {
    return this._runningSource.isRunning$;
  }

  get isRunning() {
    return this._runningSource.isRunning;
  }

  private _visibleElementStacks$: Observable<
    readonly ElementStackModel[]
  > | null = null;
  get visibleElementStacks$() {
    if (this._visibleElementStacks$ === null) {
      this._visibleElementStacks$ = this._tokensSource.tokens$.pipe(
        filterItems(isElementStackModel),
        filterItemObservations((model) => model.visible$),
        distinctUntilShallowArrayChanged(),
        shareReplay(1)
      );
    }

    return this._visibleElementStacks$;
  }

  private _unlockedTerrains$: Observable<
    readonly ConnectedTerrainModel[]
  > | null = null;
  get unlockedTerrains$() {
    if (!this._unlockedTerrains$) {
      this._unlockedTerrains$ = this._tokensSource.tokens$.pipe(
        filterItems(isConnectedTerrainModel),
        filterItemObservations((model) => model.visible$),
        distinctUntilShallowArrayChanged(),
        shareReplay(1)
      );
    }

    return this._unlockedTerrains$;
  }

  private _unlockedWorkstations$: Observable<readonly SituationModel[]> | null =
    null;

  get unlockedWorkstations$() {
    if (this._unlockedWorkstations$ === null) {
      this._unlockedWorkstations$ = this._tokensSource.tokens$.pipe(
        filterItems(isSituationModel),
        filterItemObservations((model) => model.visible$),
        distinctUntilShallowArrayChanged(),
        shareReplay(1)
      );
    }
    return this._unlockedWorkstations$;
  }

  get unlockedRecipes$() {
    return this._craftablesSource.unlockedRecipes$;
  }

  private _uniqueElementsManfiested$: Observable<
    readonly ElementModel[]
  > | null = null;
  get uniqueElementsManifested$() {
    if (!this._uniqueElementsManfiested$) {
      this._uniqueElementsManfiested$ =
        this._characterSource.uniqueElementIdsManifested$.pipe(
          map((ids) => ids.map((id) => this._compendium.getElementById(id))),
          shareReplay(1)
        );
    }

    return this._uniqueElementsManfiested$;
  }
}
