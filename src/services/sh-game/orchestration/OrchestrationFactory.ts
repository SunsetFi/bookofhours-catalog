import { inject, injectable, singleton } from "microinject";

import {
  Compendium,
  ElementModel,
  RecipeModel,
} from "@/services/sh-compendium";

import { BatchingScheduler } from "@/services/scheduler";

import { TokensSource } from "../sources/TokensSource";
import { TimeSource } from "../sources/TimeSource";

import { SituationModel } from "../token-models/SituationModel";

import { RecipeOrchestration } from "./RecipeOrchestration";
import { OngoingSituationOrchestration } from "./OngoingSituationOrchestration";
import { CompletedSituationOrchestration } from "./CompletedSituationOrchestration";
import { FreeformUnstartedOrchestration } from "./FreeformUnstartedOrchestration";

@injectable()
@singleton()
export class OrchestrationFactory {
  constructor(
    @inject(Compendium) private readonly _compendium: Compendium,
    @inject(TokensSource) private readonly _tokensSource: TokensSource,
    @inject(TimeSource) private readonly _timeSource: TimeSource,
    @inject(BatchingScheduler) private readonly _scheduler: BatchingScheduler
  ) {}

  createUnstartedOrchestration(defaultSituation: SituationModel | null) {
    return new FreeformUnstartedOrchestration(
      defaultSituation ?? null,
      this._tokensSource,
      this._compendium,
      this._scheduler
    );
  }

  createRecipeOrchestration(
    recipe: RecipeModel,
    desiredElements: ElementModel[]
  ) {
    return new RecipeOrchestration(
      recipe,
      desiredElements,
      this._compendium,
      this._tokensSource,
      this._scheduler
    );
  }

  createOngoingOrchestration(situation: SituationModel) {
    return new OngoingSituationOrchestration(
      situation,
      this._tokensSource,
      this._timeSource,
      this._scheduler
    );
  }

  createCompletedOrchestration(situation: SituationModel) {
    return new CompletedSituationOrchestration(situation);
  }
}
