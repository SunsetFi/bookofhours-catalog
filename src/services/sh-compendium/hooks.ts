import { useDIDependency } from "@/container";

import { Compendium } from "./Compendium";
import { AspectModel } from "./models/AspectModel";
import { RecipeModel } from "./models/RecipeModel";
import { ElementModel } from "./models/ElementModel";

export function useElement(elementId: string): ElementModel {
  const compendium = useDIDependency(Compendium);
  return compendium.getElementById(elementId);
}

export function useAspect(aspectId: string): AspectModel {
  const compendium = useDIDependency(Compendium);
  return compendium.getAspectById(aspectId);
}

export function useRecipe(recipeId: string): RecipeModel {
  const compendium = useDIDependency(Compendium);
  return compendium.getRecipeById(recipeId);
}
