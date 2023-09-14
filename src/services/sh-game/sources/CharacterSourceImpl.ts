import { isEqual } from "lodash";
import { inject, injectable, provides, singleton } from "microinject";
import { BehaviorSubject } from "rxjs";
import { startTransition } from "react";

import { Scheduler, TaskUnsubscriber } from "@/services/scheduler";
import { API } from "@/services/sh-api";

import { CharacterSource, RunningSource } from "./services";

@injectable()
@singleton()
@provides(CharacterSource)
export class CharacterSourceImpl implements CharacterSource {
  private _characterTaskSubscription: TaskUnsubscriber | null = null;
  private readonly _uniqueElementIdsManfiested$ = new BehaviorSubject<
    readonly string[]
  >([]);

  private readonly _ambittableRecipes$ = new BehaviorSubject<readonly string[]>(
    []
  );

  constructor(
    @inject(Scheduler) scheduler: Scheduler,
    @inject(RunningSource) runningSource: RunningSource,
    @inject(API) private readonly _api: API
  ) {
    runningSource.isRunning$.subscribe((isRunning) => {
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
    return this._uniqueElementIdsManfiested$;
  }

  get uniqueElementIdsManifested() {
    return this._uniqueElementIdsManfiested$.value;
  }

  get ambittableRecipes$() {
    return this._ambittableRecipes$;
  }

  get ambittableRecipes() {
    return this._ambittableRecipes$.value;
  }

  private async _pollCharacter(): Promise<void> {
    // No point running these in parallel, as we sync with the main thread in the game to fetch data.
    // By doing this sequentially, we take advantage of our keepalive connection.
    const manifestations = await this._api.getUniqueManifestedElements();
    const ambittableRecipes = await this._api.getAmbittableRecipesUnlocked();

    startTransition(() => {
      if (!isEqual(manifestations, this._uniqueElementIdsManfiested$.value)) {
        this._uniqueElementIdsManfiested$.next(manifestations);
      }

      if (!isEqual(ambittableRecipes, this._ambittableRecipes$.value)) {
        this._ambittableRecipes$.next(ambittableRecipes);
      }
    });
  }
}
