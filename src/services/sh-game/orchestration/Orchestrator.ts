import { inject, injectable, singleton } from "microinject";
import { BehaviorSubject, Observable, firstValueFrom } from "rxjs";

import { Compendium } from "@/services/sh-compendium";
import { Scheduler } from "@/services/scheduler";

import { RunningSource } from "../sources/RunningSource";
import { TokensSource } from "../sources/TokensSource";
import { TimeSource } from "../sources/TimeSource";

import {
  Orchestration,
  OrchestrationRequest,
  isRecipeOrchestrationRequest,
  isSituationOrchestrationRequest,
} from "./types";

import { RecipeOrchestration } from "./RecipeOrchestration";
import { OngoingSituationOrchestration } from "./OngoingSituationOrchestration";
import { CompletedSituationOrchestration } from "./CompletedSituationOrchestration";

@injectable()
@singleton()
export class Orchestrator {
  private readonly _orchestration$ = new BehaviorSubject<Orchestration | null>(
    null
  );

  constructor(
    @inject(RunningSource) runningSource: RunningSource,
    @inject(Scheduler) private readonly _scheduler: Scheduler,
    @inject(Compendium) private readonly _compendium: Compendium,
    @inject(TokensSource) private readonly _tokensSource: TokensSource,
    @inject(TimeSource) private readonly _timeSource: TimeSource
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

  async requestOrchestration(request: OrchestrationRequest) {
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

      const orchestration = new RecipeOrchestration(
        recipe,
        this._compendium,
        this._tokensSource,
        this._timeSource,
        desiredElements,
        (orchestration) => this._updateOrchestration(orchestration)
      );

      this._orchestration$.next(orchestration);
    } else if (isSituationOrchestrationRequest(request)) {
      const { situation } = request;
      const state = situation.state;
      if (state === "Ongoing") {
        const orchestration = new OngoingSituationOrchestration(
          situation,
          this._compendium,
          this._timeSource,
          (orchestration) => this._updateOrchestration(orchestration)
        );
        this._orchestration$.next(orchestration);
      } else if (state === "Complete") {
        const orchestration = new CompletedSituationOrchestration(
          situation,
          this._compendium,
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
