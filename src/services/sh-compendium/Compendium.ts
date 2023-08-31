import { inject, injectable, singleton } from "microinject";
import { Observable, distinctUntilChanged, mergeMap } from "rxjs";
import { Element } from "secrethistories-api";

import { API } from "../sh-api";
import { GameModel } from "../sh-model";
import { AspectModel } from "./AspectModel";
import { ElementModel } from "./ElementModel";

@injectable()
@singleton()
export class Compendium {
  private readonly _aspects$: Observable<Record<string, AspectModel>>;
  private readonly _elements$: Observable<Record<string, ElementModel>>;

  constructor(@inject(GameModel) cultsim: GameModel, @inject(API) api: API) {
    this._aspects$ = cultsim.isRunning$.pipe(
      distinctUntilChanged(),
      mergeMap(async (value) => {
        if (!value) {
          return {};
        }

        const aspects = await api.getAspects({ hidden: false });
        return aspects.map((aspect) => new AspectModel(aspect, api));
      })
    );

    this._elements$ = cultsim.isRunning$.pipe(
      distinctUntilChanged(),
      mergeMap(async (value) => {
        if (!value) {
          return {};
        }

        const aspects = await api.getCards({ hidden: false });
        return aspects.map((aspect) => new ElementModel(aspect, api));
      })
    );
  }

  get aspects$() {
    return this._aspects$;
  }

  get elements$() {
    return this._elements$;
  }
}
