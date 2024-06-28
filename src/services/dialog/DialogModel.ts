import { DialogAction } from "./types";

export class DialogModel<TResult = string> {
  constructor(
    private readonly _resolveDialog: (completionResult: TResult | null) => void
  ) {}

  resolve(completionResult: TResult | null) {
    this._resolveDialog(completionResult);
  }
}

export class ActionDialogModel<TResult = string> extends DialogModel<TResult> {
  constructor(
    actions: DialogAction<TResult>[],
    resolveDialog: (completionResult: TResult | null) => void
  ) {
    super(resolveDialog);

    this.actions = actions.map(
      (action) => new DialogActionModel<TResult>(action, this)
    );
  }

  readonly actions: DialogActionModel<TResult>[];
}

export class ActionPromptDialogModel<
  TResult = string
> extends ActionDialogModel<TResult> {
  constructor(
    readonly text: string,
    actions: DialogAction<TResult>[],
    resolveDialog: (completionResult: TResult | null) => void
  ) {
    super(actions, resolveDialog);
  }
}

export class DialogActionModel<TResult = string> {
  constructor(
    private readonly _action: DialogAction<TResult>,
    private readonly _model: DialogModel<TResult>
  ) {}

  get label() {
    return this._action.label;
  }

  get default() {
    return this._action.default ?? false;
  }

  onClick() {
    if (this._action.onClick) {
      this._action.onClick();
    }

    // Handle resolutions.
    if (this._action.completionResult) {
      this._model.resolve(this._action.completionResult);
    } else if (this._action.closeOnClick) {
      this._model.resolve(null);
    }
  }
}

export class ComponentDialogModel extends DialogModel {
  constructor(
    private readonly _component: React.ComponentType<{ model: DialogModel }>,
    resolveDialog: (completionResult: string | null) => void
  ) {
    super(resolveDialog);
  }

  get component() {
    return this._component;
  }
}
