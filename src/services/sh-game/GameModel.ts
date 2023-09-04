import { inject, injectable, singleton } from "microinject";
import { Observable, combineLatest, map } from "rxjs";

import { observeAll } from "@/observables";

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
  TerrainsSource,
  TokensSource,
} from "./sources";
import { Compendium, ElementModel } from "../sh-compendium";

const playerSpherePaths = [
  "~/portage1",
  "~/portage2",
  "~/portage3",
  "~/portage4",
  "~/portage5",
  "~/hand.abilities",
  "~/hand.skills",
  "~/hand.memories",
  "~/hand.misc",
];

@injectable()
@singleton()
export class GameModel {
  private readonly _unlockedWorkstations$: Observable<
    readonly SituationModel[]
  >;

  private readonly _visibleElementStacks$: Observable<
    readonly ElementStackModel[]
  >;

  constructor(
    @inject(RunningSource)
    private readonly _runningSource: RunningSource,
    @inject(Compendium) private readonly _compendium: Compendium,
    @inject(CharacterSource) private readonly _characterSource: CharacterSource,
    @inject(TokensSource) tokensSource: TokensSource,
    @inject(TerrainsSource) private readonly _terrainsSource: TerrainsSource
  ) {
    const situationsWithPath$ = tokensSource.tokens$.pipe(
      map((tokens) =>
        tokens
          .filter(isSituationModel)
          .map((token) => token.path$.pipe(map((path) => ({ token, path }))))
      ),
      observeAll()
    );

    this._unlockedWorkstations$ = combineLatest([
      situationsWithPath$,
      _terrainsSource.unlockedTerrains$,
    ]).pipe(
      map(([tokenPathPair, terrains]) => {
        const visiblePaths = [
          ...playerSpherePaths,
          ...terrains.map((t) => t.path),
        ];
        return tokenPathPair
          .filter((x) => visiblePaths.some((p) => x.path.startsWith(p)))
          .map((x) => x.token);
      })
    );

    const elementStacksWithPath$ = tokensSource.tokens$.pipe(
      map((tokens) =>
        tokens
          .filter(isElementStackModel)
          .map((token) => token.path$.pipe(map((path) => ({ token, path }))))
      ),
      observeAll()
    );

    this._visibleElementStacks$ = combineLatest([
      elementStacksWithPath$,
      _terrainsSource.unlockedTerrains$,
    ]).pipe(
      map(([tokenPathPair, terrains]) => {
        const visiblePaths = [
          ...playerSpherePaths,
          ...terrains.map((t) => t.path),
        ];
        return tokenPathPair
          .filter((x) => visiblePaths.some((p) => x.path.startsWith(p)))
          .map((x) => x.token);
      })
    );
  }

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
        map(yearFromExecutions)
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
        map(seasonFromExecutions)
      );
    }

    return this._season$;
  }

  get season() {
    return seasonFromExecutions(this._characterSource.recipeExecutions);
  }

  get visibleElementStacks$() {
    return this._visibleElementStacks$;
  }

  get unlockedTerrains$() {
    return this._terrainsSource.unlockedTerrains$;
  }

  get unlockedWorkstations$() {
    return this._unlockedWorkstations$;
  }

  private _uniqueElementsManfiested$: Observable<
    readonly ElementModel[]
  > | null = null;
  get uniqueElementsManifested$() {
    if (!this._uniqueElementsManfiested$) {
      this._uniqueElementsManfiested$ =
        this._characterSource.uniqueElementIdsManifested$.pipe(
          map((ids) => ids.map((id) => this._compendium.getElementById(id)))
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
