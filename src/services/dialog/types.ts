import { DialogModel } from "./DialogModel";

export interface ActionPromptDialogRequest {
  type: "action-prompt";
  text: string;
  actions: DialogAction[];
}

export function isTextDialogRequest(
  request: DialogRequest
): request is ActionPromptDialogRequest {
  return request.type === "action-prompt";
}

export interface ComponentDialogRequest {
  type: "component";
  component: React.ComponentType<ComponentDialogRequestProps>;
}
export type ComponentDialogRequestProps = { model: DialogModel };

export function isComponentDialogRequest(
  request: DialogRequest
): request is ComponentDialogRequest {
  return request.type === "component";
}

export interface DialogAction {
  label: string;
  closeOnClick?: boolean;
  completionResult?: string;
  default?: boolean;
  onClick?(): void;
}

export type DialogRequest = ActionPromptDialogRequest | ComponentDialogRequest;
