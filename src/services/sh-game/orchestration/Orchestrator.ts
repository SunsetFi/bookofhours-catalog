import { inject, injectable, singleton } from "microinject";
import { BehaviorSubject, Observable, firstValueFrom, map, tap } from "rxjs";

import { filterItemObservations } from "@/observables";

import { Compendium } from "@/services/sh-compendium";
import { Scheduler } from "@/services/scheduler";

import { RunningSource } from "../sources/RunningSource";
import { TokensSource } from "../sources/TokensSource";

import { SituationModel } from "../token-models/SituationModel";

import {
  Orchestration,
  OrchestrationRequest,
  isRecipeOrchestrationRequest,
  isSituationOrchestrationRequest,
} from "./types";

import { OrchestrationFactory } from "./OrchestrationFactory";

@injectable()
@singleton()
export class Orchestrator {
  private readonly _orchestration$ = new BehaviorSubject<Orchestration | null>(
    null
  );

  private readonly _open$ = new BehaviorSubject<boolean>(false);

  constructor(
    @inject(RunningSource) runningSource: RunningSource,
    @inject(TokensSource) private readonly _tokensSource: TokensSource,
    @inject(Scheduler) private readonly _scheduler: Scheduler,
    @inject(OrchestrationFactory)
    private readonly _orchestrationFactory: OrchestrationFactory,
    @inject(Compendium) private readonly _compendium: Compendium
  ) {
    runningSource.isRunning$.subscribe((isRunning) => {
      if (!isRunning) {
        this._updateOrchestration(null);
        this._open$.next(false);
      }
    });
  }

  get orchestration(): Orchestration | null {
    return this._orchestration$.value;
  }

  get orchestration$(): Observable<Orchestration | null> {
    return this._orchestration$;
  }

  get open(): boolean {
    return this._open$.value;
  }

  get open$(): Observable<boolean> {
    return this._open$;
  }

  private _executingSituations$: Observable<SituationModel[]> | null = null;
  get executingSituations$(): Observable<SituationModel[]> {
    if (!this._executingSituations$) {
      this._executingSituations$ = this._tokensSource.visibleSituations$.pipe(
        filterItemObservations((s) =>
          s.state$.pipe(map((s) => s !== "Unstarted"))
        )
      );
    }
    return this._executingSituations$;
  }

  toggleDrawer() {
    if (this._open$.value) {
      this._open$.next(false);
    } else {
      this._open$.next(true);
    }
  }

  async openOrchestration(request: OrchestrationRequest) {
    if (isRecipeOrchestrationRequest(request)) {
      const { recipeId, desiredElementIds } = request;
      const recipe = this._compendium.getRecipeById(recipeId);
      const exists = await firstValueFrom(recipe.exists$);
      if (!exists) {
        return;
      }

      const desiredElements = (desiredElementIds ?? []).map((id) =>
        this._compendium.getElementById(id)
      );

      const orchestration =
        this._orchestrationFactory.createRecipeOrchestration(
          recipe,
          desiredElements,
          (orchestration) => this._updateOrchestration(orchestration)
        );

      this._updateOrchestration(orchestration);
    } else if (isSituationOrchestrationRequest(request)) {
      const { situation } = request;
      if (situation == null || situation.state === "Unstarted") {
        const orchestration =
          this._orchestrationFactory.createUnstartedOrchestration(
            situation,
            (orchestration) => this._updateOrchestration(orchestration)
          );
        this._updateOrchestration(orchestration);
      } else if (situation.state === "Ongoing") {
        const orchestration =
          this._orchestrationFactory.createOngoingOrchestration(
            situation,
            (orchestration) => this._updateOrchestration(orchestration)
          );
        this._updateOrchestration(orchestration);
      } else if (situation.state === "Complete") {
        const orchestration =
          this._orchestrationFactory.createCompletedOrchestration(
            situation,
            (orchestration) => this._updateOrchestration(orchestration)
          );
        this._updateOrchestration(orchestration);
      }
    }

    this._open$.next(true);
  }

  closeOrchestration() {
    this._updateOrchestration(null);
  }

  private async _updateOrchestration(orchestration: Orchestration | null) {
    if (this._orchestration$.value) {
      this._orchestration$.value._dispose();
    }

    if (orchestration) {
      await this._scheduler.updateNow();
    }

    this._orchestration$.next(orchestration);
  }
}
