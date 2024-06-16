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
import { isNotNull } from "@/utils";

import { API } from "@/services/sh-api";
import { Scheduler } from "@/services/scheduler";

import { useObservation } from "@/hooks/use-observation";

import { RunningSource } from "./RunningSource";

const timeRemainingFromRecipeExclusive: Record<string, number> = {
  "day.daybreak": /*2 + */ 58 + 60 + 60 + 60 + 60 + 60,
  "day.dawn": /*2 + 58 +*/ 60 + 60 + 60 + 60 + 60,
  "day.morning": /*2 + 58 + 60 +*/ 60 + 60 + 60 + 60,
  "day.midday": /*2 + 58 + 60 + 60 +*/ 60 + 60 + 60,
  "day.afternoon": /*2 + 58 + 60 + 60 + 60 +*/ 60 + 60,
  "day.dusk": /*2 + 58 + 60 + 60 + 60 + 60 +*/ 60,
  "day.night": 0,
};

const secondsPerDay = 2 + 58 + 60 + 60 + 60 + 60 + 60;

@injectable()
@singleton()
export class TimeSource {
  private readonly _gameSpeedSource$ = new Subject<GameSpeed>();
  private readonly _timeSituationSource$ = new Subject<Situation>();
  private readonly _yearSituationSource$ = new Subject<Situation>();

  constructor(
    @inject(RunningSource) runningSource: RunningSource,
    @inject(API) private readonly _api: API,
    @inject(Scheduler) private _scheduler: Scheduler
  ) {
    let schedulerSubscription: (() => void) | null = null;
    runningSource.isRunning$
      .pipe(distinctUntilChanged())
      .subscribe((isRunning) => {
        if (isRunning) {
          schedulerSubscription = this._scheduler.addTask(() =>
            this._pollTime()
          );
        } else if (schedulerSubscription) {
          schedulerSubscription();
          schedulerSubscription = null;
        }
      });
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

  private _daysUntilNextSeason$: Observable<number> | null = null;
  get daysUntilNextSeason$() {
    if (!this._daysUntilNextSeason$) {
      this._daysUntilNextSeason$ = this._yearSituationSource$.pipe(
        map((situation) => {
          const timeRemaining = situation.timeRemaining;
          if (timeRemaining == null) {
            return Number.NaN;
          }

          return Math.ceil(timeRemaining / secondsPerDay);
        }),
        distinctUntilChanged(),
        shareReplay(1)
      );
    }

    return this._daysUntilNextSeason$;
  }

  private _seasonName$: Observable<string> | null = null;
  get seasonName$() {
    if (!this._seasonName$) {
      this._seasonName$ = this._yearSituationSource$.pipe(
        map((situation) => situation.recipeLabel),
        filter(isNotNull),
        distinctUntilChanged(),
        shareReplay(1)
      );
    }

    return this._seasonName$;
  }

  private _seasonDescription$: Observable<string> | null = null;
  get seasonDescription$() {
    if (!this._seasonDescription$) {
      this._seasonDescription$ = this._yearSituationSource$.pipe(
        map((situation) => situation.description),
        filter(isNotNull),
        distinctUntilChanged(),
        shareReplay(1)
      );
    }

    return this._seasonDescription$;
  }

  async passTime(seconds: number) {
    await this._api.passTime(seconds);
    // Re-pause, as daybreak may have reset the game speed.
    await this._api.setSpeed("Paused");
    this._scheduler.updateNow();
  }

  async passDay() {
    const time = await firstValueFrom(this.secondsUntilTomorrow$);
    // Tick past daybreak, to one tick past the end of the day to start the new one.
    // Note: The api mod takes into account recipe timers and incrementally passes time around them so that all recipes
    // execute as intended, despite the significant time gap we are jumping.
    // TODO: What is the exact delay we need for weather to show up?  Came up with +7 by trial and error.
    await this._api.passTime(time + 8 + 0.1);
    // Re-pause, as daybreak will have reset the game speed.
    await this._api.setSpeed("Paused");
    this._scheduler.updateNow();
  }

  private async _pollTime() {
    const [speed, [daySituation], [yearSituation]] = await Promise.all([
      this._api.getSpeed(),
      this._api.getTokensAtPath("~/day", { payloadType: "Situation" }),
      this._api.getTokensAtPath("~/year", { payloadType: "Situation" }),
    ]);

    this._gameSpeedSource$.next(speed);

    if (
      daySituation &&
      isSituation(daySituation) &&
      daySituation.verbId === "time"
    ) {
      this._timeSituationSource$.next(daySituation);
    }

    if (
      yearSituation &&
      isSituation(yearSituation) &&
      yearSituation.verbId === "season"
    ) {
      this._yearSituationSource$.next(yearSituation);
    }
  }
}

export function useGameSpeed(): GameSpeed | null {
  const model = useDIDependency(TimeSource);
  return useObservation(model.gameSpeed$) ?? null;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
