import { DialogModel } from "./DialogModel";

export interface ActionPromptDialogRequest<TResult = string> {
  type: "action-prompt";
  text: string;
  actions: DialogAction<TResult>[];
}

export function isTextDialogRequest(
  request: DialogRequest
): request is ActionPromptDialogRequest {
  return request.type === "action-prompt";
}

export interface ComponentDialogRequest {
  type: "component";
  component: React.ComponentType<ComponentDialogProps>;
}
export type ComponentDialogProps = { model: DialogModel };

export function isComponentDialogRequest(
  request: DialogRequest
): request is ComponentDialogRequest {
  return request.type === "component";
}

export interface DialogAction<T = string> {
  label: string;
  closeOnClick?: boolean;
  completionResult?: T;
  default?: boolean;
  onClick?(): void;
}

export type DialogRequest = ActionPromptDialogRequest | ComponentDialogRequest;
