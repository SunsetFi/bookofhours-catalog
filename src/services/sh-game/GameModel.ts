import { inject, injectable, singleton } from "microinject";
import { Observable, map, shareReplay } from "rxjs";

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
  RunningSource,
  CharacterSource,
  TokensSource,
  CraftablesSource,
} from "./sources";
import { Compendium, ElementModel } from "../sh-compendium";
import {
  ConnectedTerrainModel,
  isConnectedTerrainModel,
} from "./token-models/ConnectedTerrainModel";

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

  private _year$: Observable<number> | null = null;
  get year$() {
    if (!this._year$) {
      this._year$ = this._characterSource.recipeExecutions$.pipe(
        map(yearFromExecutions),
        shareReplay(1)
      );
    }

    return this._year$;
  }

  get year() {
    return yearFromExecutions(this._characterSource.recipeExecutions);
  }

  private _season$: Observable<string> | null = null;
  get season$() {
    if (!this._season$) {
      this._season$ = this._characterSource.recipeExecutions$.pipe(
        map(seasonFromExecutions),
        shareReplay(1)
      );
    }

    return this._season$;
  }

  get season() {
    return seasonFromExecutions(this._characterSource.recipeExecutions);
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

  get knownCraftableRecipes$() {
    return this._craftablesSource.knownCraftableRecipes$;
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

function yearFromExecutions(
  recipeExecutions: Record<string, number> | undefined
) {
  if (!recipeExecutions) {
    return 0;
  }

  return (recipeExecutions["year.season.spring"] ?? 1) - 1;
}

function seasonFromExecutions(
  recipeExecutions: Record<string, number> | undefined
) {
  if (!recipeExecutions) {
    return "spring";
  }

  const springCount = recipeExecutions["year.season.spring"] ?? 0;
  const summerCount = recipeExecutions["year.season.summer"] ?? 0;
  const autumCount = recipeExecutions["year.season.autum"] ?? 0;
  const winterCount = recipeExecutions["year.season.winter"] ?? 0;

  // The lesser is the one we are at.
  if (springCount > summerCount) {
    return "summer";
  }
  if (summerCount > autumCount) {
    return "autum";
  }
  if (autumCount > winterCount) {
    return "winter";
  }
  return "spring";
}
