import {
  BehaviorSubject,
  Observable,
  Subscription,
  firstValueFrom,
  map,
  shareReplay,
} from "rxjs";
import { Aspects, SphereSpec } from "secrethistories-api";

import { True$ } from "@/observables";

import { Compendium, RecipeModel } from "@/services/sh-compendium";

import { SituationModel } from "../token-models/SituationModel";
import { ElementStackModel } from "../token-models/ElementStackModel";

import { TimeSource } from "../sources/TimeSource";
import { TokensSource } from "../sources/TokensSource";

import {
  NoteContainingOrchestration,
  OngoingOrchestration,
  Orchestration,
  OrchestrationBase,
} from "./types";

import { CompletedSituationOrchestration } from "./CompletedSituationOrchestration";
import { OrchestrationBaseImpl } from "./OrchestrationBaseImpl";

export class OngoingSituationOrchestration
  extends OrchestrationBaseImpl
  implements
    OrchestrationBase,
    NoteContainingOrchestration,
    OngoingOrchestration
{
  private readonly _subscription: Subscription;
  constructor(
    private readonly _situation: SituationModel,
    tokensSource: TokensSource,
    private readonly _compendium: Compendium,
    private readonly _timeSource: TimeSource,
    private readonly _replaceOrchestration: (
      orchestration: Orchestration | null
    ) => void
  ) {
    super(tokensSource);
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

    // TODO: Magnet slots pull stuff in.  Reflect that in slotAssignments.
    // Also reflect the magnet-status.

    this._slotAssignments$.subscribe((assignments) => {
      for (const [key, value] of Object.entries(assignments)) {
        this._situation.setSlotContents(key, value);
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
