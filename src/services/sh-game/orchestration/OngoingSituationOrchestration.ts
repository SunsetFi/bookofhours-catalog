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
  private readonly _subscription: Subscription;
  constructor(
    private readonly _situation: SituationModel,
    tokensSource: TokensSource,
    private readonly _compendium: Compendium,
    private readonly _timeSource: TimeSource,
    orchestrationFactory: OrchestrationFactory,
    private readonly _replaceOrchestration: (
      orchestration: Orchestration | null
    ) => void
  ) {
    super(tokensSource);
    this._subscription = _situation.state$.subscribe((state) => {
      if (state === "Complete") {
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
  }

  _dispose() {
    this._subscription.unsubscribe();
  }

  private _label$: Observable<string | null> | null = null;
  get label$(): Observable<string | null> {
    if (this._label$ == null) {
      this._label$ = combineLatest([
        this._situation.label$,
        this._situation.recipeLabel$,
      ]).pipe(
        map(([situationLabel, recipeLabel]) => {
          let label = recipeLabel ?? situationLabel;
          if (label === ".") {
            label = situationLabel;
          }
          return label;
        })
      );
    }

    return this._label$;
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

  get slotAssignments$() {
    return this._situation.thresholdContents$;
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

  protected _assignSlot(
    spec: SphereSpec,
    element: ElementStackModel | null
  ): void {
    this._situation.setSlotContents(spec.id, element);
  }
}
