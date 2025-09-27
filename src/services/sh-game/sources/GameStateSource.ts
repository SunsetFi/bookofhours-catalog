import { inject, injectable, provides, singleton } from "microinject";
import { BehaviorSubject, distinctUntilChanged } from "rxjs";

import { useDIDependency } from "@/container";

import { UpdatePoller } from "@/services/update-poller";
import { API } from "@/services/sh-api";

import { useObservation } from "@/hooks/use-observation";

@injectable()
@singleton()
@provides(GameStateSource)
export class GameStateSource {
  private readonly _isRunning$ = new BehaviorSubject(false);
  private readonly _isLegacyLoaded$ = new BehaviorSubject(false);

  constructor(
    @inject(UpdatePoller) scheduler: UpdatePoller,
    @inject(API) private readonly _api: API,
  ) {
    scheduler.addTask(() => this._pollRunning());
  }

  get isGameRunning$() {
    return this._isRunning$;
  }

  get isGameRunning() {
    return this._isRunning$.value;
  }

  get isLegacyRunning$() {
    return this._isLegacyLoaded$;
  }

  get isLegacyRunning() {
    return this._isLegacyLoaded$.value;
  }

  private async _pollRunning() {
    try {
      const legacy = await this._api.getLegacy();

      if (!this._isRunning$.value) {
        this._isRunning$.next(true);
      }

      const isLegacyActive = legacy !== null;
      if (isLegacyActive !== this._isLegacyLoaded$.value) {
        this._isLegacyLoaded$.next(legacy !== null);
      }
    } catch {
      if (this._isRunning$.value) {
        this._isRunning$.next(false);
      }
      if (this._isLegacyLoaded$.value) {
        this._isLegacyLoaded$.next(false);
      }
    }
  }
}

export function useIsLegacyRunning(): boolean {
  const runningSource = useDIDependency(GameStateSource);
  return (
    useObservation(runningSource.isLegacyRunning$) ??
    runningSource.isLegacyRunning
  );
}

export function useIsGameRunning(): boolean {
  const runningSource = useDIDependency(GameStateSource);
  return (
    useObservation(runningSource.isGameRunning$) ?? runningSource.isGameRunning
  );
}
