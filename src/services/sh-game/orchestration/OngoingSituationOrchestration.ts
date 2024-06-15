import {
  BehaviorSubject,
  Observable,
  Subscription,
  combineLatest,
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
  private readonly _stateSubscription: Subscription;
  private readonly _slotAssignmentsSubscription: Subscription;

  private readonly _optimisticSlotAssignments$ = new BehaviorSubject({});

  constructor(
    private readonly _situation: SituationModel,
    tokensSource: TokensSource,
    private readonly _timeSource: TimeSource,
    orchestrationFactory: OrchestrationFactory,
    private readonly _replaceOrchestration: (
      orchestration: Orchestration | null
    ) => void
  ) {
    super(tokensSource);
    this._stateSubscription = combineLatest([
      _situation.state$,
      _situation.retired$,
    ]).subscribe(([state, retired]) => {
      if (retired) {
        this._replaceOrchestration(null);
      } else if (state === "Complete") {
        const completeOrchestration =
          orchestrationFactory.createCompletedOrchestration(
            _situation,
            this._replaceOrchestration
          );
        this._replaceOrchestration(completeOrchestration);
      } else if (state !== "Ongoing") {
        this._replaceOrchestration(null);
      }
    });

    this._slotAssignmentsSubscription = _situation.thresholdContents$.subscribe(
      (assignments) => {
        this._optimisticSlotAssignments$.next(assignments);
      }
    );
  }

  _dispose() {
    this._stateSubscription.unsubscribe();
    this._slotAssignmentsSubscription.unsubscribe();
  }

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

  get slotAssignments$() {
    // FIXME: This is indicative of something janky with our observables, as
    // thresholdContents should be immediately updated when the card slotting optimistically updates
    // its sphere path.
    // Even with this hack, we still get flickers and update lag.
    return this._optimisticSlotAssignments$;
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

  protected async _assignSlot(
    spec: SphereSpec,
    element: ElementStackModel | null
  ): Promise<void> {
    const setSlotContent = await this._situation.setSlotContents(
      spec.id,
      element
    );

    let refreshes: Promise<void>[] = [this._situation.refresh()];

    if (!setSlotContent && element) {
      // TODO: Book of Hours is returning false from TryAcceptToken for ongoing thresholds even though the token is being accepted
      console.warn(
        "Failed to set slot content for ongoing situation.  This is a known bug in this cultist simulator engine.  Forcing token refresh."
      );

      refreshes.push(element.refresh());
    }

    // Do this even if we fail, see bug above.
    this._optimisticSlotAssignments$.next({
      ...this._optimisticSlotAssignments$.value,
      [spec.id]: element,
    });

    await Promise.all(refreshes);
  }
}
