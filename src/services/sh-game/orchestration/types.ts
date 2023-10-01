import { Observable } from "rxjs";
import { SphereSpec } from "secrethistories-api";

import { RecipeModel } from "@/services/sh-compendium";

import { SituationModel } from "../token-models/SituationModel";
import { ElementStackModel } from "../token-models/ElementStackModel";

export interface OrchestrationRequest {
  recipeId: string;
  desiredElementIds?: string[];
}

export interface OrchestrationBase {
  readonly recipe$: Observable<RecipeModel | null>;
  readonly situation$: Observable<SituationModel | null>;
  readonly slots$: Observable<Readonly<Record<string, OrchestrationSlot>>>;
  readonly aspectsFilter$: Observable<readonly string[]>;

  readonly executionPlan$: Observable<ExecutionPlan | null>;

  setAspectsFilter(aspects: readonly string[]): void;
}

export interface VariableSituationOrchestration extends OrchestrationBase {
  readonly availableSituations$: Observable<readonly SituationModel[]>;
  selectSituation(situation: SituationModel | null): void;
}
export function isVariableSituationOrchestration(
  orchestration: Orchestration
): orchestration is VariableSituationOrchestration {
  return "availableSituations$" in orchestration;
}

export interface VariableRecipeOrchestration extends OrchestrationBase {
  readonly availableRecipes$: Observable<readonly RecipeModel[]>;
  selectRecipe(recipe: RecipeModel | null): void;
}

export type Orchestration = OrchestrationBase &
  (VariableRecipeOrchestration | {}) &
  (VariableSituationOrchestration | {});

export interface OrchestrationSlot {
  readonly spec: SphereSpec;
  readonly locked: boolean;
  readonly assignment$: Observable<ElementStackModel | null>;
  readonly availableElementStacks$: Observable<readonly ElementStackModel[]>;
  assign(element: ElementStackModel | null): void;
}

export interface AspectRequirement {
  current: number;
  required: number;
}

export interface ExecutionPlan {
  situation: SituationModel;
  recipe: RecipeModel;
  slots: Record<string, ElementStackModel | null>;
}
