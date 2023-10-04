import { inject, injectable, provides, singleton } from "microinject";
import { BehaviorSubject, distinctUntilChanged } from "rxjs";

import { useDIDependency } from "@/container";

import { useDeferredObservation } from "@/observables";

import { Scheduler } from "@/services/scheduler";
import { API } from "@/services/sh-api";

@injectable()
@singleton()
@provides(RunningSource)
export class RunningSource {
  private readonly _isRunningInternal$ = new BehaviorSubject(false);

  constructor(
    @inject(Scheduler) scheduler: Scheduler,
    @inject(API) private readonly _api: API
  ) {
    scheduler.addTask(() => this._pollRunning());
  }

  private readonly _isRunning$ = this._isRunningInternal$.pipe(
    distinctUntilChanged()
  );
  get isRunning$() {
    return this._isRunning$;
  }

  get isRunning() {
    return this._isRunningInternal$.value;
  }

  private async _pollRunning() {
    try {
      const legacy = await this._api.getLegacy();
      this._isRunningInternal$.next(legacy !== null);
    } catch {
      this._isRunningInternal$.next(false);
    }
  }
}

export function useIsRunning(): boolean | undefined {
  const runningSource = useDIDependency(RunningSource);
  return (
    useDeferredObservation(runningSource.isRunning$) ?? runningSource.isRunning
  );
}
