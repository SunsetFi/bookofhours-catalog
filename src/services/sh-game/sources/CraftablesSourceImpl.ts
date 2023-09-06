import { inject, injectable, provides, singleton } from "microinject";
import { Observable, map, shareReplay } from "rxjs";

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
  private readonly _knownCraftableRecipes$: Observable<readonly RecipeModel[]>;
  constructor(
    @inject(Compendium) compendium: Compendium,
    @inject(CharacterSource) characterSource: CharacterSource
  ) {
    this._knownCraftableRecipes$ = characterSource.recipeExecutions$.pipe(
      map((executions) =>
        Object.keys(executions).filter((recipeId) =>
          recipeId.startsWith("craft.")
        )
      ),
      mapArrayItemsCached((recipeId) => compendium.getRecipeById(recipeId)),
      distinctUntilShallowArrayChanged(),
      shareReplay(1)
    );
  }

  get knownCraftableRecipes$() {
    return this._knownCraftableRecipes$;
  }
}
