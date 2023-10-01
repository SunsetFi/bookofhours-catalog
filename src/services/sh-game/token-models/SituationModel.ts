import {
  BehaviorSubject,
  Observable,
  distinctUntilChanged,
  map,
  shareReplay,
} from "rxjs";
import {
  Aspects,
  Situation as ISituation,
  SituationState,
} from "secrethistories-api";
import { isEqual } from "lodash";

import { API } from "../../sh-api";

import type { ConnectedTerrainModel } from "./ConnectedTerrainModel";
import { TokenModel } from "./TokenModel";
import { TokenVisibilityFactory } from "./TokenVisibilityFactory";
import { TokenParentTerrainFactory } from "./TokenParentTerrainFactory";

export function isSituationModel(model: TokenModel): model is SituationModel {
  return model instanceof SituationModel;
}

export class SituationModel extends TokenModel {
  private readonly _situation$: BehaviorSubject<ISituation>;

  private readonly _visible$: Observable<boolean>;
  private readonly _parentTerrain$: Observable<ConnectedTerrainModel | null>;

  constructor(
    situation: ISituation,
    api: API,
    visibilityFactory: TokenVisibilityFactory,
    parentTerrainFactory: TokenParentTerrainFactory
  ) {
    super(situation, api);
    this._situation$ = new BehaviorSubject<ISituation>(situation);

    this._visible$ = visibilityFactory.createVisibilityObservable(
      this._situation$
    );
    this._parentTerrain$ = parentTerrainFactory.createParentTerrainObservable(
      this._situation$
    );
  }

  get id(): string {
    return this._situation$.value.id;
  }

  get payloadType(): "Situation" {
    return "Situation";
  }

  get iconUrl(): string {
    return `${this._api.baseUrl}/api/by-path/${this._situation$.value.path}/icon.png`;
  }

  get verbId() {
    return this._situation$.value.verbId;
  }

  get visible$() {
    return this._visible$;
  }

  get parentTerrain$() {
    return this._parentTerrain$;
  }

  private _label$: Observable<string | null> | null = null;
  get label$() {
    if (!this._label$) {
      this._label$ = this._situation$.pipe(
        map((s) => s.label),
        distinctUntilChanged(),
        shareReplay(1)
      );
    }

    return this._label$;
  }

  private _description$: Observable<string | null> | null = null;
  get description$() {
    if (!this._description$) {
      this._description$ = this._situation$.pipe(
        map((s) => s.description),
        distinctUntilChanged(),
        shareReplay(1)
      );
    }

    return this._description$;
  }

  private _verbLabel$: Observable<string | null> | null = null;
  get verbLabel$() {
    if (!this._verbLabel$) {
      this._verbLabel$ = this._situation$.pipe(
        map((s) => s.verbLabel),
        distinctUntilChanged(),
        shareReplay(1)
      );
    }

    return this._verbLabel$;
  }

  private _aspects$: Observable<Aspects> | null = null;
  get aspects$() {
    if (!this._aspects$) {
      this._aspects$ = this._situation$.pipe(
        map((s) => Object.freeze({ ...s.aspects })),
        distinctUntilChanged(isEqual),
        shareReplay(1)
      );
    }

    return this._aspects$;
  }

  private _hints$: Observable<readonly string[]> | null = null;
  get hints$() {
    if (!this._hints$) {
      this._hints$ = this._situation$.pipe(
        map((s) => Object.freeze([...s.hints])),
        distinctUntilChanged(isEqual),
        shareReplay(1)
      );
    }

    return this._hints$;
  }

  get thresholds() {
    return this._situation$.value.thresholds;
  }

  // This is a bit wonky, but thankfully workstation thresholds all require at least 1 aspect rather than any limits.
  // Because of this, we can sum up the aspects into one object to get an idea of how many cards of that type you can slot.
  // This kinda breaks down with 'essential' aspects, but those are rare enough for workstations that I'm not going to worry about it.
  private _thresholdAspects$: Observable<Aspects> | null = null;
  get thresholdAspects$() {
    if (!this._thresholdAspects$) {
      this._thresholdAspects$ = this._situation$.pipe(
        map((s) => {
          const thresholds = s.thresholds;
          const slotTypes: Aspects = {};
          for (const t of thresholds) {
            for (const type in t.required) {
              if (slotTypes[type] === undefined) {
                slotTypes[type] = 0;
              }
              slotTypes[type] += t.required[type];
            }
          }

          return slotTypes;
        }),
        distinctUntilChanged(isEqual),
        shareReplay(1)
      );
    }

    return this._thresholdAspects$;
  }

  private _state$: Observable<SituationState> | null = null;
  get state$() {
    if (!this._state$) {
      this._state$ = this._situation$.pipe(
        map((s) => s.state),
        distinctUntilChanged(),
        shareReplay(1)
      );
    }

    return this._state$;
  }

  private _recipeId$: Observable<string | null> | null = null;
  get recipeId$() {
    if (!this._recipeId$) {
      this._recipeId$ = this._situation$.pipe(
        map((s) => s.recipeId),
        distinctUntilChanged(),
        shareReplay(1)
      );
    }

    return this._recipeId$;
  }

  private _recipeLabel$: Observable<string | null> | null = null;
  get recipeLabel$() {
    if (!this._recipeLabel$) {
      this._recipeLabel$ = this._situation$.pipe(
        map((s) => s.recipeLabel),
        distinctUntilChanged(),
        shareReplay(1)
      );
    }

    return this._recipeLabel$;
  }

  private _currentRecipeId$: Observable<string | null> | null = null;
  get currentRecipeId$() {
    if (!this._currentRecipeId$) {
      this._currentRecipeId$ = this._situation$.pipe(
        map((s) => s.currentRecipeId),
        distinctUntilChanged(),
        shareReplay(1)
      );
    }

    return this._currentRecipeId$;
  }

  private _currentRecipeLabel$: Observable<string | null> | null = null;
  get currentRecipeLabel$() {
    if (!this._currentRecipeLabel$) {
      this._currentRecipeLabel$ = this._situation$.pipe(
        map((s) => s.currentRecipeLabel),
        distinctUntilChanged(),
        shareReplay(1)
      );
    }

    return this._currentRecipeLabel$;
  }

  private _timeRemaining$: Observable<number> | null = null;
  get timeRemaining$() {
    if (!this._timeRemaining$) {
      this._timeRemaining$ = this._situation$.pipe(
        map((s) => s.timeRemaining),
        distinctUntilChanged(),
        shareReplay(1)
      );
    }

    return this._timeRemaining$;
  }

  async execute() {
    try {
      const result = await this._api.executeTokenAtPath(this.path);
      this._situation$.next({
        ...this._situation$.value,
        label: result.executedRecipeLabel,
        state: "Ongoing",
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  _onUpdate(situation: ISituation) {
    if (situation.id !== this.id) {
      throw new Error("Invalid situation update: Wrong ID.");
    }

    this._situation$.next(situation);
  }
}
