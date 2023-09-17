import { inject, injectable, singleton } from "microinject";
import { SphereSpec } from "secrethistories-api";
import { pickBy } from "lodash";

import {
  BehaviorSubject,
  Observable,
  combineLatest,
  map,
  shareReplay,
} from "rxjs";

import { SituationModel } from "./token-models/SituationModel";
import { ElementStackModel } from "./token-models/ElementStackModel";

import { GameModel } from "./GameModel";

interface RecipeOrchestration {
  readonly situation: SituationModel | null;
  readonly inputs: readonly ElementStackModel[];
  readonly assignments: Readonly<Record<string, ElementStackModel>>;
}

@injectable()
@singleton()
export class RecipeOrchestrator {
  private readonly _orchestration$ =
    new BehaviorSubject<RecipeOrchestration | null>(null);

  constructor(@inject(GameModel) private readonly _gameModel: GameModel) {}

  private _isOrchestrating$: Observable<boolean> | null = null;
  get isOrchestrating$() {
    if (this._isOrchestrating$ === null) {
      this._isOrchestrating$ = this._orchestration$.pipe(
        map((o) => o !== null)
      );
    }

    return this._isOrchestrating$;
  }

  private _selectedSituation$: Observable<SituationModel | null> | null = null;
  get selectedSituation$() {
    if (this._selectedSituation$ === null) {
      this._selectedSituation$ = this._orchestration$.pipe(
        map((o) => o?.situation ?? null)
      );
    }

    return this._selectedSituation$;
  }

  private _availableSituations$: Observable<readonly SituationModel[]> | null =
    null;
  get availableSituations$() {
    if (this._availableSituations$ === null) {
      this._availableSituations$ = combineLatest([
        this._orchestration$,
        this._gameModel.unlockedWorkstations$,
      ]).pipe(
        map(([state, workstations]) =>
          state
            ? workstations.filter((workstation) =>
                this._isSituationValidForState(workstation, state)
              )
            : []
        ),
        shareReplay(1)
      );
    }

    return this._availableSituations$;
  }

  private _selectedInputs$: Observable<readonly ElementStackModel[]> | null =
    null;
  get selectedInputs$() {
    if (this._selectedInputs$ === null) {
      this._selectedInputs$ = this._orchestration$.pipe(
        map((o) => o?.inputs ?? [])
      );
    }

    return this._selectedInputs$;
  }

  beginOrchestration(
    situation: SituationModel | null,
    inputs: ElementStackModel[]
  ) {
    this._beginOrchestration({ situation, inputs });
  }

  addInput(element: ElementStackModel) {
    const state = this._orchestration$.value;
    if (!state) {
      throw new Error("No orchestration in progress.");
    }

    this._updateOrchestration({
      ...state,
      inputs: [...state.inputs, element],
    });

    if (
      state.situation &&
      !this._isSituationValidForState(state.situation, state)
    ) {
      this._updateOrchestration({
        ...state,
        situation: null,
      });

      // TODO: Try to choose a new situation.
    }
  }

  removeInput(element: ElementStackModel) {
    const state = this._orchestration$.value;
    if (!state) {
      throw new Error("No orchestration in progress.");
    }

    const assignments = pickBy(state.assignments, (x) => x !== element);

    this._updateOrchestration({
      ...state,
      inputs: state.inputs.filter((x) => x !== element),
      assignments,
    });
  }

  cancel() {
    this._orchestration$.next(null);
  }

  private _beginOrchestration(data: Partial<RecipeOrchestration>) {
    this._orchestration$.next({
      situation: null,
      inputs: [],
      assignments: {},
      ...data,
    });
  }

  private _updateOrchestration(data: Partial<RecipeOrchestration>) {
    this._orchestration$.next({
      situation: null,
      inputs: [],
      assignments: {},
      ...(this._orchestration$.value ?? {}),
      ...data,
    });
  }

  private _isSituationValidForState(
    situation: SituationModel,
    state: RecipeOrchestration
  ) {
    // At this stage, we only care about compatibility, not if there is actually room.
    for (const input of state.inputs) {
      if (!situation.thresholds.some((t) => sphereMatchesToken(t, input))) {
        return false;
      }
    }

    return true;
  }
}

function sphereMatchesToken(t: SphereSpec, input: ElementStackModel): unknown {
  for (const essential of Object.keys(t.essential)) {
    const expectedValue = t.essential[essential];
    const compareValue = input.elementAspects[essential];
    if (expectedValue < 0) {
      if (compareValue >= -expectedValue) {
        return false;
      }
    } else if (compareValue < expectedValue) {
      return false;
    }
  }

  let foundRequired = false;
  for (const required of Object.keys(t.required)) {
    foundRequired = true;
    const expectedValue = t.required[required];
    const compareValue = input.elementAspects[required];
    if (expectedValue < 0) {
      if (compareValue < -expectedValue) {
        foundRequired = true;
        break;
      }
    } else if (compareValue >= expectedValue) {
      foundRequired = true;
      break;
    }
  }
  if (!foundRequired) {
    return false;
  }

  for (const forbidden of Object.keys(t.forbidden)) {
    const expectedValue = t.forbidden[forbidden];
    const compareValue = input.elementAspects[forbidden];
    if (expectedValue < 0) {
      if (compareValue < -expectedValue) {
        return false;
      }
    } else if (compareValue >= expectedValue) {
      return false;
    }
  }

  return true;
}
