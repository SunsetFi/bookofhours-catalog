import { inject, injectable, provides, singleton } from "microinject";
import { Observable, map, shareReplay } from "rxjs";

import {
  distinctUntilShallowArrayChanged,
  filterItemObservations,
  filterItems,
  mapArrayItemsCached,
} from "@/observables";

import { Compendium, RecipeModel } from "@/services/sh-compendium";

import {
  SituationModel,
  isSituationModel,
} from "../token-models/SituationModel";

import { CharacterSource, CraftingSource, TokensSource } from "./services";

@injectable()
@singleton()
@provides(CraftingSource)
export class CraftingSourceImpl implements CraftingSource {
  private readonly _unlockedRecipes$: Observable<readonly RecipeModel[]>;
  private readonly _unlockedWorkstations$: Observable<
    readonly SituationModel[]
  >;
  private readonly _unlockedHarvestStations$: Observable<
    readonly SituationModel[]
  >;

  constructor(
    @inject(Compendium) compendium: Compendium,
    @inject(CharacterSource) characterSource: CharacterSource,
    @inject(TokensSource) private readonly _tokensSource: TokensSource
  ) {
    this._unlockedRecipes$ = characterSource.ambittableRecipes$.pipe(
      // used to filter this for recipes starting with craft., but ambittables seem to be specific
      // opt-in recipes, so we might not need to do that.
      mapArrayItemsCached((recipeId) => compendium.getRecipeById(recipeId)),
      distinctUntilShallowArrayChanged(),
      shareReplay(1)
    );
    this._unlockedWorkstations$ = this._tokensSource.tokens$.pipe(
      filterItems(isSituationModel),
      filterItemObservations((model) => model.visible$),
      map((situations) =>
        situations.filter(
          (x) =>
            !x.verbId.startsWith("library.bed.") &&
            !x.verbId.startsWith("garden.")
        )
      ),
      distinctUntilShallowArrayChanged(),
      shareReplay(1)
    );
    this._unlockedHarvestStations$ = this._tokensSource.tokens$.pipe(
      filterItems(isSituationModel),
      filterItemObservations((model) => model.visible$),
      map((situations) =>
        situations.filter((x) => x.verbId.startsWith("garden."))
      ),
      distinctUntilShallowArrayChanged(),
      shareReplay(1)
    );
  }

  get unlockedRecipes$() {
    return this._unlockedRecipes$;
  }

  get unlockedWorkstations$() {
    return this._unlockedWorkstations$;
  }

  get unlockedHarvestStations$() {
    return this._unlockedHarvestStations$;
  }
}
