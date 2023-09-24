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
  ConnectedTerrainModel,
  isConnectedTerrainModel,
} from "./token-models/ConnectedTerrainModel";

import {
  RunningSource,
  CharacterSource,
  TokensSource,
  CraftingSource,
  TimeSource,
} from "./sources";
import {
  SituationModel,
  isSituationModel,
} from "./token-models/SituationModel";
import { Scheduler } from "../scheduler";

@injectable()
@singleton()
export class GameModel {
  constructor(
    @inject(RunningSource)
    private readonly _runningSource: RunningSource,
    @inject(Scheduler) scheduler: Scheduler,
    @inject(TimeSource) private readonly _timeSource: TimeSource,
    @inject(Compendium) private readonly _compendium: Compendium,
    @inject(CharacterSource) private readonly _characterSource: CharacterSource,
    @inject(CraftingSource)
    private readonly _craftingSource: CraftingSource,
    @inject(TokensSource) private readonly _tokensSource: TokensSource
  ) {
    this._runningSource.isRunning$.subscribe((isRunning) => {
      if (isRunning) {
        scheduler.updateNow();
      }
    });
  }

  get isRunning$() {
    return this._runningSource.isRunning$;
  }

  get isRunning() {
    return this._runningSource.isRunning;
  }

  get gameSpeed$() {
    return this._timeSource.gameSpeed$;
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

  private _considerVerb$: Observable<SituationModel | null> | null = null;
  get considerVerb$() {
    if (this._considerVerb$ == null) {
      this._considerVerb$ = this._tokensSource.tokens$.pipe(
        map(
          (tokens) =>
            tokens
              .filter(isSituationModel)
              .find((x) => x.path.startsWith("~/fixedverbs!consider.")) ?? null
        ),
        shareReplay(1)
      );
    }

    return this._considerVerb$;
  }

  get unlockedWorkstations$() {
    return this._craftingSource.unlockedWorkstations$;
  }

  get unlocekdHarvestStations$() {
    return this._craftingSource.unlockedHarvestStations$;
  }

  get unlockedRecipes$() {
    return this._craftingSource.unlockedRecipes$;
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
