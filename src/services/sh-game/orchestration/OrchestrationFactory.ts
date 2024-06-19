import { inject, injectable, singleton } from "microinject";

import {
  Compendium,
  ElementModel,
  RecipeModel,
} from "@/services/sh-compendium";

import { TokensSource } from "../sources/TokensSource";
import { TimeSource } from "../sources/TimeSource";

import { SituationModel } from "../token-models/SituationModel";

import { Orchestration } from "./types";

import { RecipeOrchestration } from "./RecipeOrchestration";
import { OngoingSituationOrchestration } from "./OngoingSituationOrchestration";
import { CompletedSituationOrchestration } from "./CompletedSituationOrchestration";
import { UnstartedSituationOrchestration } from "./UnstartedSituationOrchestration";

@injectable()
@singleton()
export class OrchestrationFactory {
  constructor(
    @inject(Compendium) private readonly _compendium: Compendium,
    @inject(TokensSource) private readonly _tokensSource: TokensSource,
    @inject(TimeSource) private readonly _timeSource: TimeSource
  ) {}

  createUnstartedOrchestration(
    defaultSituation: SituationModel | null,
    updateOrchestration: (orchestration: Orchestration | null) => void
  ) {
    return new UnstartedSituationOrchestration(
      defaultSituation ?? null,
      this._tokensSource,
      this._compendium,
      this,
      updateOrchestration
    );
  }

  createRecipeOrchestration(
    recipe: RecipeModel,
    desiredElements: ElementModel[],
    updateOrchestration: (orchestration: Orchestration | null) => void
  ) {
    return new RecipeOrchestration(
      recipe,
      desiredElements,
      this._compendium,
      this._tokensSource,
      this,
      updateOrchestration
    );
  }

  createOngoingOrchestration(
    situation: SituationModel,
    updateOrchestration: (orchestration: Orchestration | null) => void
  ) {
    return new OngoingSituationOrchestration(
      situation,
      this._tokensSource,
      this._timeSource
    );
  }

  createCompletedOrchestration(
    situation: SituationModel,
    updateOrchestration: (orchestration: Orchestration | null) => void
  ) {
    return new CompletedSituationOrchestration(situation, updateOrchestration);
  }
}
