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

export interface DialogAction {
  label: string;
  closeOnClick?: boolean;
  completionResult?: string;
  default?: boolean;
  onClick?(): void;
}

export type DialogRequest = ActionPromptDialogRequest;
