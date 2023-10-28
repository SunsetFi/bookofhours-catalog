import { Observable } from "rxjs";
import { Aspects, SphereSpec } from "secrethistories-api";

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
  situation: SituationModel;
}
export function isSituationOrchestrationRequest(
  request: OrchestrationRequest
): request is SituationOrchestrationRequest {
  return "situation" in request;
}

export interface OrchestrationBase {
  readonly recipe$: Observable<RecipeModel | null>;
  readonly requirements$: Observable<Readonly<Aspects>>;
  readonly situation$: Observable<SituationModel | null>;
  readonly slots$: Observable<Readonly<Record<string, OrchestrationSlot>>>;
  readonly aspects$: Observable<Readonly<Aspects>>;

  _dispose(): void;
}

export interface NoteContainingOrchestration extends OrchestrationBase {
  readonly notes$: Observable<readonly ElementStackModel[]>;
  readonly content$: Observable<readonly ElementStackModel[]>;
}
export function isContentContainingOrchestration(
  orchestration: Orchestration
): orchestration is NoteContainingOrchestration {
  return "content$" in orchestration;
}

export interface OngoingOrchestration extends OrchestrationBase {
  readonly timeRemaining$: Observable<number>;
  passTime(): Promise<boolean>;
}
export function isOngoingOrchestration(
  orchestration: Orchestration
): orchestration is OngoingOrchestration {
  return "passTime" in orchestration;
}

export interface CompletedOrchestration extends NoteContainingOrchestration {
  conclude(): Promise<boolean>;
}

export function isCompletedOrchestration(
  orchestration: Orchestration
): orchestration is CompletedOrchestration {
  return "conclude" in orchestration;
}

export interface ExecutableOrchestration extends OrchestrationBase {
  readonly startDescription$: Observable<string>;
  readonly canExecute$: Observable<boolean>;
  prepare(): Promise<boolean>;
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
