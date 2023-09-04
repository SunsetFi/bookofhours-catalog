import { isEqual } from "lodash";
import { inject, injectable, provides, singleton } from "microinject";
import { BehaviorSubject } from "rxjs";

import { Scheduler, TaskUnsubscriber } from "@/services/scheduler";
import { API } from "@/services/sh-api";

import { CharacterSource, RunningSource } from "./services";

@injectable()
@singleton()
@provides(CharacterSource)
export class CharacterSourceImpl implements CharacterSource {
  private _taskSubscription: TaskUnsubscriber | null = null;
  private readonly _uniqueElementIdsManfiested$ = new BehaviorSubject<
    readonly string[]
  >([]);

  private readonly _recipeExecutions$ = new BehaviorSubject<
    Readonly<Record<string, number>>
  >({});

  constructor(
    @inject(Scheduler) scheduler: Scheduler,
    @inject(RunningSource) runningSource: RunningSource,
    @inject(API) private readonly _api: API
  ) {
    runningSource.isRunning$.subscribe((isRunning) => {
      if (!isRunning) {
        if (this._taskSubscription) {
          this._taskSubscription();
          this._taskSubscription = null;
        }
      } else {
        if (!this._taskSubscription) {
          this._taskSubscription = scheduler.addTask(
            () =>
              Promise.all([
                this._pollManifestations(),
                this._pollRecipeExecutions(),
              ]) as any
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

  get recipeExecutions$() {
    return this._recipeExecutions$;
  }

  get recipeExecutions() {
    return this._recipeExecutions$.value;
  }

  private async _pollManifestations() {
    const manifestations = await this._api.getUniqueManifestedElements();
    if (!isEqual(manifestations, this._uniqueElementIdsManfiested$.value)) {
      this._uniqueElementIdsManfiested$.next(manifestations);
    }
  }

  private async _pollRecipeExecutions() {
    const recipeExecutions = await this._api.getRecipeExecutions();
    if (!isEqual(recipeExecutions, this._recipeExecutions$.value)) {
      this._recipeExecutions$.next(recipeExecutions);
    }
  }
}
