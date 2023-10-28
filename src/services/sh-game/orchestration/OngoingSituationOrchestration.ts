import {
  BehaviorSubject,
  Observable,
  Subscription,
  firstValueFrom,
  map,
  shareReplay,
} from "rxjs";
import { Aspects } from "secrethistories-api";

import { Compendium, RecipeModel } from "@/services/sh-compendium";

import { SituationModel } from "../token-models/SituationModel";
import { ElementStackModel } from "../token-models/ElementStackModel";

import { TimeSource } from "../sources/TimeSource";

import {
  NoteContainingOrchestration,
  OngoingOrchestration,
  Orchestration,
  OrchestrationBase,
  OrchestrationSlot,
} from "./types";

import { CompletedSituationOrchestration } from "./CompletedSituationOrchestration";

export class OngoingSituationOrchestration
  implements
    OrchestrationBase,
    NoteContainingOrchestration,
    OngoingOrchestration
{
  private readonly _subscription: Subscription;
  constructor(
    private readonly _situation: SituationModel,
    private readonly _compendium: Compendium,
    private readonly _timeSource: TimeSource,
    private readonly _replaceOrchestration: (
      orchestration: Orchestration | null
    ) => void
  ) {
    this._subscription = _situation.state$.subscribe((state) => {
      if (state === "Complete") {
        this._replaceOrchestration(
          new CompletedSituationOrchestration(
            _situation,
            _compendium,
            _replaceOrchestration
          )
        );
      } else if (state !== "Ongoing") {
        this._replaceOrchestration(null);
      }
    });
  }

  _dispose() {
    this._subscription.unsubscribe();
  }

  private _recipe$: Observable<RecipeModel | null> | null = null;
  get recipe$(): Observable<RecipeModel | null> {
    if (!this._recipe$) {
      this._recipe$ = this._situation.recipeId$.pipe(
        map((recipeId) =>
          recipeId ? this._compendium.getRecipeById(recipeId) : null
        ),
        shareReplay(1)
      );
    }

    return this._recipe$;
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

  private _content$: Observable<readonly ElementStackModel[]> | null = null;
  get content$(): Observable<readonly ElementStackModel[]> {
    if (!this._content$) {
      // TODO: Show content sphere items.
      this._content$ = new BehaviorSubject([]);
      // this._content$ = this._situation.content$;
    }

    return this._content$;
  }

  private _slots$: Observable<
    Readonly<Record<string, OrchestrationSlot>>
  > | null = null;
  get slots$(): Observable<Readonly<Record<string, OrchestrationSlot>>> {
    if (!this._slots$) {
      // TODO: Ongoing slots
      this._slots$ = new BehaviorSubject({});
    }

    return this._slots$;
  }

  private _aspects$: Observable<Readonly<Record<string, number>>> | null = null;
  get aspects$(): Observable<Readonly<Record<string, number>>> {
    if (!this._aspects$) {
      // TODO: Ongoing aspects
      this._aspects$ = new BehaviorSubject({});
    }

    return this._aspects$;
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
}
