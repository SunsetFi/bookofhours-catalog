import { inject, injectable, singleton } from "microinject";
import {
  Observable,
  Subject,
  distinctUntilChanged,
  filter,
  firstValueFrom,
  map,
  shareReplay,
} from "rxjs";
import { GameSpeed, Situation, isSituation } from "secrethistories-api";

import { useDIDependency } from "@/container";
import { useDeferredObservation } from "@/observables";
import { isNotNull } from "@/utils";

import { API } from "@/services/sh-api";
import { Scheduler } from "@/services/scheduler";

const timeRemainingFromRecipeExclusive: Record<string, number> = {
  "day.daybreak": /*2 + */ 58 + 60 + 60 + 60 + 60 + 60,
  "day.dawn": /*2 + 58 +*/ 60 + 60 + 60 + 60 + 60,
  "day.morning": /*2 + 58 + 60 +*/ 60 + 60 + 60 + 60,
  "day.midday": /*2 + 58 + 60 + 60 +*/ 60 + 60 + 60,
  "day.afternoon": /*2 + 58 + 60 + 60 + 60 +*/ 60 + 60,
  "day.dusk": /*2 + 58 + 60 + 60 + 60 + 60 +*/ 60,
  "day.night": 0,
};

const totalDayLength = 2 + 58 + 60 + 60 + 60 + 60 + 60;

@injectable()
@singleton()
export class TimeSource {
  private readonly _gameSpeedSource$ = new Subject<GameSpeed>();
  private readonly _timeSituationSource$ = new Subject<Situation>();

  constructor(
    @inject(API) private readonly _api: API,
    @inject(Scheduler) private _scheduler: Scheduler
  ) {
    this._scheduler.addTask(() => this._pollTime());
  }

  private _gameSpeed$: Observable<GameSpeed> | null = null;
  get gameSpeed$() {
    if (!this._gameSpeed$) {
      this._gameSpeed$ = this._gameSpeedSource$.pipe(
        distinctUntilChanged(),
        shareReplay(1)
      );
    }
    return this._gameSpeed$;
  }

  private _timeOfDay$: Observable<string> | null = null;
  get timeOfDay$() {
    if (!this._timeOfDay$) {
      this._timeOfDay$ = this._timeSituationSource$.pipe(
        map((situation) => situation.currentRecipeId),
        filter(isNotNull),
        distinctUntilChanged(),
        shareReplay(1)
      );
    }

    return this._timeOfDay$;
  }

  private _secondsUntilNextTimeOfDay$: Observable<number> | null = null;
  get secondsUntilNextTimeOfDay$() {
    if (!this._secondsUntilNextTimeOfDay$) {
      this._secondsUntilNextTimeOfDay$ = this._timeSituationSource$.pipe(
        map((situation) => situation.timeRemaining),
        distinctUntilChanged(),
        shareReplay(1)
      );
    }

    return this._secondsUntilNextTimeOfDay$;
  }

  private _secondsUntilTomorrow$: Observable<number> | null = null;
  get secondsUntilTomorrow$() {
    if (!this._secondsUntilTomorrow$) {
      this._secondsUntilTomorrow$ = this._timeSituationSource$.pipe(
        map((situation) => {
          let timeRemaining =
            timeRemainingFromRecipeExclusive[situation.recipeId!];
          if (timeRemaining == null) {
            return Number.NaN;
          }

          timeRemaining += situation.timeRemaining;
          return timeRemaining;
        }),
        distinctUntilChanged(),
        shareReplay(1)
      );
    }

    return this._secondsUntilTomorrow$;
  }

  async passTime(seconds: number) {
    await this._api.passTime(seconds);
    this._scheduler.updateNow();
  }

  async passDay() {
    const time = await firstValueFrom(this.secondsUntilTomorrow$);
    // Tick one min-tick past the end of the day to start the new one.
    await this.passTime(time + 0.1);
    this._scheduler.updateNow();
  }

  private async _pollTime() {
    const [speed, [daySituation]] = await Promise.all([
      this._api.getSpeed(),
      this._api.getTokensAtPath("~/day", { payloadType: "Situation" }),
    ]);

    this._gameSpeedSource$.next(speed);
    if (
      daySituation &&
      isSituation(daySituation) &&
      daySituation.verbId === "time"
    ) {
      this._timeSituationSource$.next(daySituation);
    }
  }
}

export function useGameSpeed(): GameSpeed | null {
  const model = useDIDependency(TimeSource);
  return useDeferredObservation(model.gameSpeed$) ?? null;
}
