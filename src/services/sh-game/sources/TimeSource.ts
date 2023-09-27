import { inject, injectable, singleton } from "microinject";
import { BehaviorSubject, Observable } from "rxjs";
import { GameSpeed } from "secrethistories-api";

import { API } from "@/services/sh-api";
import { Scheduler } from "@/services/scheduler";
import { useDIDependency } from "@/container";
import { useObservation } from "@/observables";

@injectable()
@singleton()
export class TimeSource {
  private readonly _gameSpeed$ = new BehaviorSubject<GameSpeed | null>(null);

  constructor(
    @inject(API) private readonly _api: API,
    @inject(Scheduler) scheduler: Scheduler
  ) {
    scheduler.addTask(() => this._pollGameSpeed());
  }

  get gameSpeed$(): Observable<GameSpeed | null> {
    return this._gameSpeed$;
  }

  private async _pollGameSpeed() {
    const speed = await this._api.getSpeed();
    if (speed !== this._gameSpeed$.value) {
      this._gameSpeed$.next(speed);
    }
  }
}

export function useGameSpeed(): GameSpeed | null {
  const model = useDIDependency(TimeSource);
  return useObservation(model.gameSpeed$) ?? null;
}
