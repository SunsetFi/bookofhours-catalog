import { Observable } from "rxjs";
import { Aspects, SituationState, SphereSpec } from "secrethistories-api";

import { SituationModel } from "../token-models/SituationModel";
import { ElementStackModel } from "../token-models/ElementStackModel";
import { SituationStateChangedResponse } from "./internal";

export type OrchestrationRequest =
  | RecipeOrchestrationRequest
  | SituationOrchestrationRequest;
export interface RecipeOrchestrationRequest {
  recipeId: string;
  desiredElementIds?: string[];
}
export function isRecipeOrchestrationRequest(
  request: OrchestrationRequest,
): request is RecipeOrchestrationRequest {
  return "recipeId" in request;
}

export interface SituationOrchestrationRequest {
  situation: SituationModel | null;
}
export function isSituationOrchestrationRequest(
  request: OrchestrationRequest,
): request is SituationOrchestrationRequest {
  return "situation" in request;
}

export interface OrchestrationBase {
  readonly label$: Observable<string | null>;
  readonly description$: Observable<string | null>;

  readonly requirements$: Observable<Readonly<Aspects>>;
  readonly situation$: Observable<SituationModel | null>;
  readonly aspects$: Observable<Readonly<Aspects>>;

  /**
   * Called when the target situation state updates.
   * If this is specified, the orchestration will not be replaced when the situation state changes.
   * If this is not specified, the Orchestrator will replace the orchestration automatically depending
   * on the state.
   * @param situationState The current state of the orchestration's current situation.
   */
  _onSituationStateUpdated?(
    situationState: SituationState,
  ): SituationStateChangedResponse;

  _dispose(): void;
}

export interface VariableSituationOrchestration extends OrchestrationBase {
  readonly availableSituations$: Observable<readonly SituationModel[]>;
  selectSituation(situation: SituationModel | null): void;
}
export function isVariableSituationOrchestration(
  orchestration: Orchestration,
): orchestration is VariableSituationOrchestration {
  return "availableSituations$" in orchestration;
}

export interface ThresholdedOrchestration extends OrchestrationBase {
  readonly slots$: Observable<readonly OrchestrationSlot[]>;
  readonly canAutofill$: Observable<boolean>;
  autofill(): Promise<void>;
}
export function isThresholdedOrchestration(
  orchestration: Orchestration,
): orchestration is ThresholdedOrchestration {
  return "slots$" in orchestration;
}

export interface ContentContainingOrchestration extends OrchestrationBase {
  readonly notes$: Observable<readonly ElementStackModel[]>;
  readonly content$: Observable<readonly ElementStackModel[]>;
}
export function isContentContainingOrchestration(
  orchestration: Orchestration,
): orchestration is ContentContainingOrchestration {
  return "content$" in orchestration;
}

export interface ExecutableOrchestration
  extends OrchestrationBase,
    ThresholdedOrchestration {
  readonly canExecute$: Observable<boolean>;
  execute(): Promise<boolean>;
}
export function isExecutableOrchestration(
  orchestration: Orchestration,
): orchestration is ExecutableOrchestration {
  return "canExecute$" in orchestration;
}

export interface OngoingOrchestration
  extends OrchestrationBase,
    ThresholdedOrchestration {
  readonly timeRemaining$: Observable<number>;
  passTime(): Promise<boolean>;
}
export function isOngoingOrchestration(
  orchestration: Orchestration,
): orchestration is OngoingOrchestration {
  return "passTime" in orchestration;
}

export interface CompletedOrchestration extends ContentContainingOrchestration {
  conclude(): Promise<boolean>;
}

export function isCompletedOrchestration(
  orchestration: Orchestration,
): orchestration is CompletedOrchestration {
  return "conclude" in orchestration;
}

export type Orchestration = OrchestrationBase &
  (VariableSituationOrchestration | {}) &
  (ThresholdedOrchestration | {}) &
  (ContentContainingOrchestration | {}) &
  (OngoingOrchestration | {}) &
  (CompletedOrchestration | {}) &
  (ExecutableOrchestration | {});

export type PendingOrchestration = OrchestrationBase &
  (VariableSituationOrchestration | {}) &
  ExecutableOrchestration;
export const isPendingOrchestration = isExecutableOrchestration;
export interface OrchestrationSlot {
  readonly spec: SphereSpec;
  readonly locked: boolean;
  readonly assignment$: Observable<ElementStackModel | null>;
  readonly availableElementStacks$: Observable<readonly ElementStackModel[]>;
  assign(element: ElementStackModel | null): void;
}
