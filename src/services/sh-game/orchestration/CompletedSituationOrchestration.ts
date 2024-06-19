import {
  BehaviorSubject,
  Observable,
  firstValueFrom,
  map,
  shareReplay,
} from "rxjs";
import { Aspects, combineAspects } from "secrethistories-api";

import { EmptyObject$, observeAllMap } from "@/observables";

import { SituationModel } from "../token-models/SituationModel";
import { ElementStackModel } from "../token-models/ElementStackModel";

import {
  CompletedOrchestration,
  Orchestration,
  OrchestrationBase,
  OrchestrationSlot,
} from "./types";

export class CompletedSituationOrchestration
  implements OrchestrationBase, CompletedOrchestration
{
  constructor(
    private readonly _situation: SituationModel,
    private readonly _replaceOrchestration: (
      orchestration: Orchestration | null
    ) => void
  ) {}

  _dispose() {}

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

  get slots$(): Observable<Readonly<Record<string, OrchestrationSlot>>> {
    return EmptyObject$;
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
    // Special case for unlocks; they cease to exist on completion.
    // hack: Make sure the damn thing exists.  Unlocking terrains are being finicky.
    await this._situation.refresh();
    if (this._situation.retired) {
      this._replaceOrchestration(null);
      return true;
    }

    if (await this._situation.conclude()) {
      this._replaceOrchestration(null);
      return true;
    }

    return false;
  }
}
