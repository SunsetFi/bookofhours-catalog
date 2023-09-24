import { Observable } from "rxjs";
import { SphereSpec } from "secrethistories-api";

import { RecipeModel } from "@/services/sh-compendium";

import { SituationModel } from "../token-models/SituationModel";
import { ElementStackModel } from "../token-models/ElementStackModel";

export interface OrchestrationBase {
  readonly recipe$: Observable<RecipeModel | null>;
  readonly situation$: Observable<SituationModel | null>;
  readonly slots$: Observable<Readonly<Record<string, OrchestrationSlot>>>;
  readonly aspectsFilter$: Observable<readonly string[]>;

  readonly solution$: Observable<OrchestrationSolution | null>;

  setAspectsFilter(aspects: readonly string[]): void;
  assignSlot(slotId: string, element: ElementStackModel): void;
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
  readonly assignment: ElementStackModel | null;
}

export interface OrchestrationSolution {
  readonly recipeId: string;
  readonly situationPath: string;
  readonly slotTargetsByPath: Readonly<Record<string, string>>;
}
