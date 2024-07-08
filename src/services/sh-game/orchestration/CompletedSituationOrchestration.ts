import { BehaviorSubject, Observable, map, shareReplay } from "rxjs";
import { Aspects, SituationState, combineAspects } from "secrethistories-api";

import { EmptyObject$, observeAllMap } from "@/observables";

import { SituationModel } from "../token-models/SituationModel";
import { ElementStackModel } from "../token-models/ElementStackModel";

import { CompletedOrchestration, OrchestrationBase } from "./types";

export class CompletedSituationOrchestration
  implements OrchestrationBase, CompletedOrchestration
{
  constructor(private readonly _situation: SituationModel) {}

  _dispose() {}

  _onSituationStateUpdated(situationState: SituationState) {
    // Don't re-open in the instant of time we transition to Unstarted.
    if (situationState !== "Complete") {
      return "clear-orchestration";
    }

    return null;
  }

  get label$(): Observable<string | null> {
    return this._situation.label$;
  }

  get description$() {
    return this._situation.description$;
  }

  get requirements$(): Observable<Readonly<Aspects>> {
    return EmptyObject$;
  }

  private readonly _situation$ = new BehaviorSubject(this._situation);
  get situation$(): Observable<SituationModel | null> {
    return this._situation$;
  }

  private _aspects$: Observable<Readonly<Aspects>> | null = null;
  get aspects$(): Observable<Readonly<Aspects>> {
    if (!this._aspects$) {
      this._aspects$ = this._situation.output$.pipe(
        observeAllMap((output) => output.aspects$),
        map((aspects) => aspects.reduce((a, b) => combineAspects(a, b), {})),
        shareReplay(1)
      );
    }

    return this._aspects$;
  }

  get notes$() {
    return this._situation.notes$;
  }

  get content$(): Observable<readonly ElementStackModel[]> {
    return this._situation.output$;
  }

  async conclude(): Promise<boolean> {
    if (await this._situation.conclude()) {
      return true;
    }

    return false;
  }
}
