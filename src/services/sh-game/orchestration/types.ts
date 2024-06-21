import { Observable } from "rxjs";
import { Aspects, SituationState, SphereSpec } from "secrethistories-api";

import { RecipeModel } from "@/services/sh-compendium";

import { SituationModel } from "../token-models/SituationModel";
import { ElementStackModel } from "../token-models/ElementStackModel";

export type OrchestrationRequest =
  | RecipeOrchestrationRequest
  | SituationOrchestrationRequest;
export interface RecipeOrchestrationRequest {
  recipeId: string;
  desiredElementIds?: string[];
}
export function isRecipeOrchestrationRequest(
  request: OrchestrationRequest
): request is RecipeOrchestrationRequest {
  return "recipeId" in request;
}

export interface SituationOrchestrationRequest {
  situation: SituationModel | null;
}
export function isSituationOrchestrationRequest(
  request: OrchestrationRequest
): request is SituationOrchestrationRequest {
  return "situation" in request;
}

export interface OrchestrationBase {
  readonly label$: Observable<string | null>;
  readonly description$: Observable<string | null>;

  readonly requirements$: Observable<Readonly<Aspects>>;
  readonly situation$: Observable<SituationModel | null>;
  readonly slots$: Observable<Readonly<Record<string, OrchestrationSlot>>>;
  readonly aspects$: Observable<Readonly<Aspects>>;

  /**
   * Called when the target situation state updates.
   * If this is specified, the orchestration will not be replaced when the situation state changes.
   * If this is not specified, the Orchestrator will replace the orchestration automatically depending
   * on the state.
   * @param situationState The current state of the orchestration's current situation.
   */
  _onSituationStateUpdated?(situationState: SituationState): void;

  _dispose(): void;
}

export interface ContentContainingOrchestration extends OrchestrationBase {
  readonly notes$: Observable<readonly ElementStackModel[]>;
  readonly content$: Observable<readonly ElementStackModel[]>;
}
export function isContentContainingOrchestration(
  orchestration: Orchestration
): orchestration is ContentContainingOrchestration {
  return "content$" in orchestration;
}

export interface OngoingOrchestration extends OrchestrationBase {
  readonly canAutofill$: Observable<boolean>;
  autofill(): Promise<void>;
  readonly timeRemaining$: Observable<number>;
  passTime(): Promise<boolean>;
}
export function isOngoingOrchestration(
  orchestration: Orchestration
): orchestration is OngoingOrchestration {
  return "passTime" in orchestration;
}

export interface CompletedOrchestration extends ContentContainingOrchestration {
  conclude(): Promise<boolean>;
}

export function isCompletedOrchestration(
  orchestration: Orchestration
): orchestration is CompletedOrchestration {
  return "conclude" in orchestration;
}

export interface ExecutableOrchestration extends OrchestrationBase {
  readonly canAutofill$: Observable<boolean>;
  autofill(): Promise<void>;
  readonly canExecute$: Observable<boolean>;
  execute(): Promise<boolean>;
}
export function isExecutableOrchestration(
  orchestration: Orchestration
): orchestration is ExecutableOrchestration {
  return "canExecute$" in orchestration;
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
