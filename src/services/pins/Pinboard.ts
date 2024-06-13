import { inject, injectable, singleton } from "microinject";
import {
  BehaviorSubject,
  Observable,
  map,
  shareReplay,
  combineLatest,
} from "rxjs";
import { intersection } from "lodash";

import { switchMapIfNotNull, observeAllMap } from "@/observables";

import { Compendium, RecipeModel } from "../sh-compendium";

import { PinItemRequest } from "./types";
import { PinnedElementItemModel, PinnedItemModel } from "./PinnedItemModel";

export interface PinnedAspect {
  readonly current: number;
  readonly desired: number;
}

@injectable()
@singleton()
export class Pinboard {
  private readonly _pinnedRecipeId$ = new BehaviorSubject<string | null>(null);
  private readonly _pins$ = new BehaviorSubject<readonly PinnedItemModel[]>([]);

  constructor(@inject(Compendium) private readonly _compendium: Compendium) {}

  private _pinnedRecipe$: Observable<RecipeModel | null> | null = null;
  get pinnedRecipe$() {
    if (!this._pinnedRecipe$) {
      this._pinnedRecipe$ = this._pinnedRecipeId$.pipe(
        map((id) => (id ? this._compendium.getRecipeById(id) : null)),
        shareReplay(1)
      );
    }

    return this._pinnedRecipe$;
  }

  get pins$(): Observable<readonly PinnedItemModel[]> {
    return this._pins$;
  }

  private _pinnedAspects$: Observable<
    Readonly<Record<string, PinnedAspect>>
  > | null = null;
  get pinnedAspects$() {
    if (!this._pinnedAspects$) {
      this._pinnedAspects$ = combineLatest([
        this._pins$.pipe(observeAllMap((x) => x.aspects$)),
        this.pinnedRecipe$.pipe(switchMapIfNotNull((r) => r.requirements$)),
      ]).pipe(
        map(([aspectArray, recipeReqs]) => {
          const result: Record<string, PinnedAspect> = {};

          const commonAspects = intersection(
            ...aspectArray.map((x) => Object.keys(x))
          );

          for (const aspects of aspectArray) {
            for (const aspect of Object.keys(aspects)) {
              if (recipeReqs) {
                // Don't show aspects that aren't in the recipe.
                if (!recipeReqs[aspect]) {
                  continue;
                }
              } else if (!commonAspects.includes(aspect)) {
                // Don't show aspects that arent common to the pins.
                continue;
              }

              result[aspect] = {
                desired: 0,
                current: (result[aspect]?.current ?? 0) + aspects[aspect],
              };
            }
          }

          if (recipeReqs) {
            for (const key of Object.keys(recipeReqs)) {
              let desiredValue = Number(recipeReqs[key]);
              if (isNaN(desiredValue)) {
                desiredValue = result[recipeReqs[key]]?.current ?? 0;
              }

              if (desiredValue <= 0) {
                continue;
              }

              result[key] = {
                current: result[key]?.current ?? 0,
                desired: desiredValue,
              };
            }
          }

          return result;
        }),
        shareReplay(1)
      );
    }

    return this._pinnedAspects$;
  }

  pinRecipe(recipeId: string | null) {
    this._pinnedRecipeId$.next(recipeId);
  }

  async isTokenPinned$(tokenId: string) {
    return new BehaviorSubject(false);
  }

  isElementPinned$(elementId: string) {
    return this._pins$.pipe(
      observeAllMap((x) => x.elementId$),
      map((items) => items.includes(elementId)),
      shareReplay(1)
    );
  }

  async pin(item: PinItemRequest) {
    const elementModel = await this._compendium.getElementById(item.elementId);

    let model: PinnedItemModel;
    model = new PinnedElementItemModel(elementModel, () => this.remove(model));

    this._pins$.next([...this._pins$.value, model]);
  }

  removeElementId(elementId: string) {
    this._pins$.next(
      this._pins$.value.filter((x) => x.elementId !== elementId)
    );
  }

  remove(model: PinnedItemModel) {
    this._pins$.next(this._pins$.value.filter((x) => x !== model));
  }

  clear() {
    this._pinnedRecipeId$.next(null);
    this._pins$.next([]);
  }
}
