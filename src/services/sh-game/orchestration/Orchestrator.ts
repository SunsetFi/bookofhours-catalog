import { inject, injectable, singleton } from "microinject";
import { BehaviorSubject, Observable, firstValueFrom } from "rxjs";

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

@injectable()
@singleton()
export class Orchestrator {
  private readonly _orchestration$ = new BehaviorSubject<Orchestration | null>(
    null
  );

  constructor(
    @inject(RunningSource) runningSource: RunningSource,
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
  }

  close() {
    this._orchestration$.next(null);
  }

  private async _updateOrchestration(orchestration: Orchestration | null) {
    if (this._orchestration$.value) {
      this._orchestration$.value._dispose();
    }

    await this._scheduler.updateNow();

    this._orchestration$.next(orchestration);
  }
}
