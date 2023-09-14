import { inject, injectable, provides, singleton } from "microinject";
import { Observable, shareReplay } from "rxjs";

import {
  distinctUntilShallowArrayChanged,
  mapArrayItemsCached,
} from "@/observables";

import { Compendium, RecipeModel } from "@/services/sh-compendium";

import { CharacterSource, CraftablesSource } from "./services";

@injectable()
@singleton()
@provides(CraftablesSource)
export class CraftablesSourceImpl implements CraftablesSource {
  private readonly _unlockedRecipes$: Observable<readonly RecipeModel[]>;
  constructor(
    @inject(Compendium) compendium: Compendium,
    @inject(CharacterSource) characterSource: CharacterSource
  ) {
    this._unlockedRecipes$ = characterSource.ambittableRecipes$.pipe(
      // used to filter this for recipes starting with craft., but ambittables seem to be specific
      // opt-in recipes, so we might not need to do that.
      mapArrayItemsCached((recipeId) => compendium.getRecipeById(recipeId)),
      distinctUntilShallowArrayChanged(),
      shareReplay(1)
    );
  }

  get unlockedRecipes$() {
    return this._unlockedRecipes$;
  }
}
