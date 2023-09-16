import { inject, injectable, provides, singleton } from "microinject";
import { BehaviorSubject, Observable } from "rxjs";
import { GameSpeed } from "secrethistories-api";

import { API } from "@/services/sh-api";
import { Scheduler } from "@/services/scheduler";

import { TimeSource } from "./services";

@injectable()
@singleton()
@provides(TimeSource)
export class TimeSourceImpl implements TimeSource {
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
