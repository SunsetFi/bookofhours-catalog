import {
  BehaviorSubject,
  Observable,
  combineLatest,
  distinctUntilChanged,
  map,
  shareReplay,
} from "rxjs";
import { Aspects, Situation as ISituation } from "secrethistories-api";

import { API } from "../../sh-api";

import { extractLibraryRoomTokenIdFromPath } from "../utils";

import { TerrainsSource } from "../sources";

import { ConnectedTerrainModel } from "./ConnectedTerrainModel";
import { TokenModel } from "./TokenModel";
import { isEqual } from "lodash";

export function isSituationModel(model: TokenModel): model is SituationModel {
  return model instanceof SituationModel;
}

export class SituationModel extends TokenModel {
  private readonly _situation$: BehaviorSubject<ISituation>;

  constructor(
    situation: ISituation,
    private readonly _terrainsSource: TerrainsSource,
    private readonly _api: API
  ) {
    super(situation);
    this._situation$ = new BehaviorSubject<ISituation>(situation);
  }

  get id(): string {
    return this._situation$.value.id;
  }

  get payloadType(): "Situation" {
    return "Situation";
  }

  private _parentTerrain$: Observable<ConnectedTerrainModel | null> | null =
    null;
  get parentTerrain$() {
    if (!this._parentTerrain$) {
      this._parentTerrain$ = combineLatest([
        this._situation$,
        this._terrainsSource.unlockedTerrains$,
      ]).pipe(
        map(([situation, terrains]) => {
          const tokenId = extractLibraryRoomTokenIdFromPath(situation.path);
          if (tokenId === null) {
            return null;
          }

          const terrain = terrains.find((t) => t.id === tokenId);
          if (terrain === undefined) {
            return null;
          }

          return terrain;
        }),
        distinctUntilChanged(),
        shareReplay(1)
      );
    }

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

  private _state$: Observable<string | null> | null = null;
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

  get iconUrl(): string {
    return `${this._api.baseUrl}/api/by-path/${this._situation$.value.path}/icon.png`;
  }

  _onUpdate(situation: ISituation) {
    if (situation.id !== this.id) {
      throw new Error("Invalid situation update: Wrong ID.");
    }

    this._situation$.next(situation);
  }
}
