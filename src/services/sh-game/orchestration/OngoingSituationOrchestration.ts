import { BehaviorSubject, Observable } from "rxjs";
import { Aspects, SphereSpec } from "secrethistories-api";

import { True$ } from "@/observables";

import { BatchingScheduler } from "@/services/scheduler";

import { SituationModel } from "../token-models/SituationModel";
import { ElementStackModel } from "../token-models/ElementStackModel";

import { TimeSource } from "../sources/TimeSource";
import { TokensSource } from "../sources/TokensSource";

import {
  ContentContainingOrchestration,
  OngoingOrchestration,
  OrchestrationBase,
} from "./types";

import { OrchestrationBaseImpl } from "./OrchestrationBaseImpl";

export class OngoingSituationOrchestration
  extends OrchestrationBaseImpl
  implements
    OrchestrationBase,
    ContentContainingOrchestration,
    OngoingOrchestration
{
  constructor(
    private readonly _situation: SituationModel,
    tokensSource: TokensSource,
    private readonly _timeSource: TimeSource,
    scheduler: BatchingScheduler
  ) {
    super(tokensSource, scheduler);
  }

  _dispose() {}

  get label$(): Observable<string | null> {
    return this._situation.label$;
  }

  get description$(): Observable<string | null> {
    return this._situation.description$;
  }

  private _requirements$: Observable<Readonly<Aspects>> | null = null;
  get requirements$(): Observable<Readonly<Aspects>> {
    if (!this._requirements$) {
      this._requirements$ = new BehaviorSubject({});
    }

    return this._requirements$;
  }

  private _situation$: Observable<SituationModel | null> | null = null;
  get situation$(): Observable<SituationModel | null> {
    if (!this._situation$) {
      this._situation$ = new BehaviorSubject<SituationModel | null>(
        this._situation
      );
    }

    return this._situation$;
  }

  get notes$() {
    return this._situation.notes$;
  }

  get content$() {
    return this._situation.content$;
  }

  get timeRemaining$() {
    return this._situation.timeRemaining$;
  }

  async passTime() {
    try {
      const timer = this._situation.timeRemaining;
      if (timer > 0) {
        await this._timeSource.passTime(timer + 0.1);
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  protected _createSlotCandidateFilter(
    elementStack: ElementStackModel,
    spec: SphereSpec
  ): Observable<boolean> {
    // We have no additional logic to add.
    // Let the base apply its own matching.
    return True$;
  }
}
