import { inject, injectable, singleton } from "microinject";
import { Observable, mergeMap } from "rxjs";
import { Element } from "secrethistories-api";

import { API } from "../sh-api";
import { GameModel } from "../sh-model";

@injectable()
@singleton()
export class Compendium {
  private readonly _aspects$: Observable<Record<string, Element>>;

  constructor(@inject(GameModel) cultsim: GameModel, @inject(API) api: API) {
    this._aspects$ = cultsim.isRunning$.pipe(
      mergeMap(async (value) => {
        if (!value) {
          return {};
        }

        return api.getAspects({ hidden: false });
      })
    );
  }

  get aspects$() {
    return this._aspects$;
  }
}
