import { inject, injectable, singleton } from "microinject";
import { Observable } from "rxjs";
import { Element } from "secrethistories-api";

import { promiseFuncToObservable } from "@/observables";

import { API } from "../sh-api";

import { AspectModel } from "./AspectModel";
import { ElementModel } from "./ElementModel";

@injectable()
@singleton()
export class Compendium {
  private readonly _aspectModels = new Map<string, AspectModel>();
  private readonly _aspects$: Observable<readonly AspectModel[]>;

  private readonly _elementModels = new Map<string, ElementModel>();
  private readonly _elements$: Observable<readonly ElementModel[]>;

  constructor(@inject(API) private readonly _api: API) {
    this._aspects$ = promiseFuncToObservable(() => this._getAllAspectModels());

    this._elements$ = promiseFuncToObservable(() =>
      this._getAllElementModels()
    );
  }

  get aspects$() {
    return this._aspects$;
  }

  get elements$() {
    return this._elements$;
  }

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

  private async _getAllElementModels(): Promise<readonly ElementModel[]> {
    const elements = await this._api.getElements({ hidden: false });
    const models = elements.map(
      (element) =>
        new ElementModel(element.id, () => Promise.resolve(element), this._api)
    );
    models.forEach((model) => this._elementModels.set(model.id, model));
    return models;
  }

  private async _getAllAspectModels(): Promise<readonly AspectModel[]> {
    const aspects = await this._api.getAspects({ hidden: false });
    const models = aspects.map(
      (element) =>
        new AspectModel(element.id, () => Promise.resolve(element), this._api)
    );
    models.forEach((model) => this._aspectModels.set(model.id, model));
    return models;
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
}
