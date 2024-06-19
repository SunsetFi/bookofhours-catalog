import {
  BehaviorSubject,
  Observable,
  Subscription,
  combineLatest,
  firstValueFrom,
  map,
  shareReplay,
  switchMap,
} from "rxjs";
import { Aspects, SphereSpec } from "secrethistories-api";

import { True$ } from "@/observables";

import { Compendium, RecipeModel } from "@/services/sh-compendium";

import { SituationModel } from "../token-models/SituationModel";
import { ElementStackModel } from "../token-models/ElementStackModel";

import { TimeSource } from "../sources/TimeSource";
import { TokensSource } from "../sources/TokensSource";

import {
  ContentContainingOrchestration,
  OngoingOrchestration,
  Orchestration,
  OrchestrationBase,
} from "./types";

import { OrchestrationBaseImpl } from "./OrchestrationBaseImpl";
import { OrchestrationFactory } from "./OrchestrationFactory";

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
    private readonly _timeSource: TimeSource
  ) {
    super(tokensSource);
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

  get content$(): Observable<readonly ElementStackModel[]> {
    return this._situation.content$;
  }

  get timeRemaining$() {
    return this._situation.timeRemaining$;
  }

  async passTime() {
    try {
      const timer = await firstValueFrom(this._situation.timeRemaining$);
      if (timer > 0) {
        await this._timeSource.passTime(timer + 0.1);
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  protected _filterSlotCandidates(
    spec: SphereSpec,
    elementStack: ElementStackModel
  ): Observable<boolean> {
    // We have no additional logic to add.
    // Let the base apply its own matching.
    return True$;
  }
}
