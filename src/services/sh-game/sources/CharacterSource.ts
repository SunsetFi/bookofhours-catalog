import { inject, injectable, singleton } from "microinject";
import { Observable, Subject, map, shareReplay } from "rxjs";
import { startTransition } from "react";

import {
  distinctUntilShallowArrayChanged,
  mapArrayItemsCached,
} from "@/observables";

import { UpdatePoller, TaskUnsubscriber } from "@/services/update-poller";
import {
  Compendium,
  ElementModel,
  RecipeModel,
} from "@/services/sh-compendium";
import { API } from "@/services/sh-api";

import { GameStateSource } from "./GameStateSource";

@injectable()
@singleton()
export class CharacterSource implements CharacterSource {
  private _characterTaskSubscription: TaskUnsubscriber | null = null;
  private readonly _uniqueElementIdsManifestedSubject$ = new Subject<
    readonly string[]
  >();
  private readonly _uniqueElementIdsManifested$ =
    this._uniqueElementIdsManifestedSubject$.pipe(
      distinctUntilShallowArrayChanged()
    );

  private readonly _ambittableRecipeIdsSubject$ = new Subject<
    readonly string[]
  >();
  private readonly _ambittableRecipeIds$ =
    this._ambittableRecipeIdsSubject$.pipe(distinctUntilShallowArrayChanged());

  constructor(
    @inject(UpdatePoller) scheduler: UpdatePoller,
    @inject(GameStateSource) runningSource: GameStateSource,
    @inject(Compendium) private readonly _compendium: Compendium,
    @inject(API) private readonly _api: API
  ) {
    runningSource.isLegacyRunning$.subscribe((isRunning) => {
      if (!isRunning) {
        if (this._characterTaskSubscription) {
          this._characterTaskSubscription();
          this._characterTaskSubscription = null;
        }
      } else {
        if (!this._characterTaskSubscription) {
          this._characterTaskSubscription = scheduler.addTask(() =>
            this._pollCharacter()
          );
        }
      }
    });
  }

  get uniqueElementIdsManifested$() {
    return this._uniqueElementIdsManifested$;
  }

  private _uniqueElementsManfiested$: Observable<
    readonly ElementModel[]
  > | null = null;
  get uniqueElementsManifested$() {
    if (!this._uniqueElementsManfiested$) {
      this._uniqueElementsManfiested$ = this._uniqueElementIdsManifested$.pipe(
        map((ids) => ids.map((id) => this._compendium.getElementById(id))),
        shareReplay(1)
      );
    }

    return this._uniqueElementsManfiested$;
  }

  get ambittableRecipeIds$() {
    return this._ambittableRecipeIds$;
  }

  private _ambittableRecipes$: Observable<readonly RecipeModel[]> | null = null;
  get ambittableRecipes$() {
    if (!this._ambittableRecipes$) {
      this._ambittableRecipes$ = this._ambittableRecipeIds$.pipe(
        // used to filter this for recipes starting with craft., but ambittables seem to be specific
        // opt-in recipes, so we might not need to do that.
        mapArrayItemsCached((recipeId) =>
          this._compendium.getRecipeById(recipeId)
        ),
        distinctUntilShallowArrayChanged(),
        shareReplay(1)
      );
    }

    return this._ambittableRecipes$;
  }

  private async _pollCharacter(): Promise<void> {
    // No point running these in parallel, as we sync with the main thread in the game to fetch data.
    // By doing this sequentially, we take advantage of our keepalive connection.
    const manifestations = await this._api.getUniqueManifestedElements();
    const ambittableRecipes = await this._api.getAmbittableRecipesUnlocked();

    startTransition(() => {
      this._uniqueElementIdsManifestedSubject$.next(manifestations);
      this._ambittableRecipeIdsSubject$.next(ambittableRecipes);
    });
  }
}
