export type DialogRequest = TextDialogRequest;

export interface TextDialogRequest {
  text: string;
  actions: DialogAction[];
}

export function isTextDialogRequest(
  request: DialogRequest
): request is TextDialogRequest {
  return "text" in request;
}

export interface DialogAction {
  label: string;
  closeOnClick?: boolean;
  completionResult?: string;
  default?: boolean;
  onClick?(): void;
}
