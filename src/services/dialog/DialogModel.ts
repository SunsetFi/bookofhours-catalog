import { DialogAction } from "./types";

export class DialogModel {
  constructor(
    private readonly _resolveDialog: (completionResult: string | null) => void
  ) {}

  resolve(completionResult: string | null) {
    this._resolveDialog(completionResult);
  }
}

export class ActionDialogModel extends DialogModel {
  constructor(
    actions: DialogAction[],
    resolveDialog: (completionResult: string | null) => void
  ) {
    super(resolveDialog);

    this.actions = actions.map((action) => new DialogActionModel(action, this));
  }

  readonly actions: DialogActionModel[];
}

export class ActionPromptDialogModel extends ActionDialogModel {
  constructor(
    readonly text: string,
    actions: DialogAction[],
    resolveDialog: (completionResult: string | null) => void
  ) {
    super(actions, resolveDialog);
  }
}

export class DialogActionModel {
  constructor(
    private readonly _action: DialogAction,
    private readonly _model: DialogModel
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
