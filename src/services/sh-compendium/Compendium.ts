import { inject, injectable, singleton } from "microinject";
import { Element, Recipe, Verb } from "secrethistories-api";

import { API } from "../sh-api";

import { AspectModel } from "./models/AspectModel";
import { ElementModel } from "./models/ElementModel";
import { RecipeModel } from "./models/RecipeModel";

@injectable()
@singleton()
export class Compendium {
  private readonly _aspectModels = new Map<string, AspectModel>();
  private readonly _elementModels = new Map<string, ElementModel>();
  private readonly _recipeModels = new Map<string, RecipeModel>();
  private readonly _verbCache = new Map<string, Promise<Verb | null>>();

  constructor(@inject(API) private readonly _api: API) {}

  getElementById(id: string): ElementModel {
    if (!this._elementModels.has(id)) {
      const model = new ElementModel(
        id,
        () => this._resolveElementById(id),
        this._api
      );
      this._elementModels.set(id, model);
    }

    return this._elementModels.get(id)!;
  }

  getAspectById(id: string): AspectModel {
    if (!this._aspectModels.has(id)) {
      const model = new AspectModel(
        id,
        () => this._resolveAspectById(id),
        this._api
      );
      this._aspectModels.set(id, model);
    }

    return this._aspectModels.get(id)!;
  }

  getRecipeById(id: string): RecipeModel {
    if (!this._recipeModels.has(id)) {
      const model = new RecipeModel(id, () => this._resolveRecipeById(id));
      this._recipeModels.set(id, model);
    }

    return this._recipeModels.get(id)!;
  }

  getVerbById(id: string): Promise<Verb | null> {
    if (!this._verbCache.has(id)) {
      const promise = this._api.getVerbById(id);
      this._verbCache.set(id, promise);
    }

    return this._verbCache.get(id)!;
  }

  private async _resolveAspectById(id: string): Promise<Element | null> {
    const element = await this._api.getElement(id);
    if (!element || !element.isAspect) {
      return null;
    }

    return element;
  }

  private async _resolveElementById(id: string): Promise<Element | null> {
    const element = await this._api.getElement(id);
    if (!element || element.isAspect) {
      return null;
    }

    return element;
  }

  private async _resolveRecipeById(id: string): Promise<Recipe | null> {
    const recipe = await this._api.getRecipeById(id);
    if (!recipe) {
      return null;
    }

    return recipe;
  }
}
