import { inject, injectable, singleton } from "microinject";
import { BehaviorSubject, Observable, firstValueFrom, map } from "rxjs";

import { filterItemObservations } from "@/observables";

import { Compendium } from "@/services/sh-compendium";
import { Scheduler } from "@/services/scheduler";

import { RunningSource } from "../sources/RunningSource";

import {
  Orchestration,
  OrchestrationRequest,
  isRecipeOrchestrationRequest,
  isSituationOrchestrationRequest,
} from "./types";

import { OrchestrationFactory } from "./OrchestrationFactory";
import { SituationModel } from "../token-models/SituationModel";
import { TokensSource } from "../sources/TokensSource";

export type OrchestratorForm = "dialog" | "drawer";

@injectable()
@singleton()
export class Orchestrator {
  private readonly _orchestration$ = new BehaviorSubject<Orchestration | null>(
    null
  );

  private readonly _form$ = new BehaviorSubject<OrchestratorForm | null>(null);

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
        this.close();
      }
    });
  }

  get orchestration$(): Observable<Orchestration | null> {
    return this._orchestration$;
  }

  get form$(): Observable<OrchestratorForm | null> {
    return this._form$;
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
    if (this._form$.value === "drawer") {
      this._form$.next(null);
    } else {
      this._form$.next("drawer");
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

      this._orchestration$.next(orchestration);
    } else if (isSituationOrchestrationRequest(request)) {
      const { situation } = request;
      const state = situation.state;
      if (state === "Ongoing") {
        const orchestration =
          this._orchestrationFactory.createOngoingOrchestration(
            situation,
            (orchestration) => this._updateOrchestration(orchestration)
          );
        this._orchestration$.next(orchestration);
      } else if (state === "Complete") {
        const orchestration =
          this._orchestrationFactory.createCompletedOrchestration(
            situation,
            (orchestration) => this._updateOrchestration(orchestration)
          );
        this._orchestration$.next(orchestration);
      }
    }

    // Always use dialog for now
    // if (this._form$.value == null) {
    this._form$.next("dialog");
    // }
  }

  close() {
    this._orchestration$.next(null);
    this._form$.next(null);
  }

  private async _updateOrchestration(orchestration: Orchestration | null) {
    if (this._orchestration$.value) {
      this._orchestration$.value._dispose();
    }

    await this._scheduler.updateNow();

    this._orchestration$.next(orchestration);

    if (orchestration == null && this._form$.value === "dialog") {
      this._form$.next(null);
    }
  }
}
