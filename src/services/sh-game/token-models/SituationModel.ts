import {
  BehaviorSubject,
  Observable,
  combineLatest,
  distinctUntilChanged,
  map,
  shareReplay,
} from "rxjs";
import { Situation as ISituation } from "secrethistories-api";

import { API } from "../../sh-api";

import { extractLibraryRoomTokenIdFromPath } from "../utils";

import { TerrainsSource } from "../sources";

import { ConnectedTerrainModel } from "./ConnectedTerrainModel";
import { TokenModel } from "./TokenModel";

export function isSituationModel(model: TokenModel): model is SituationModel {
  return model instanceof SituationModel;
}

export class SituationModel extends TokenModel {
  private readonly _situation$: BehaviorSubject<ISituation>;

  private readonly _parentConnectedTerrain$: Observable<ConnectedTerrainModel | null>;
  private readonly _timeRemaining$: Observable<number>;
  private readonly _recipeId$: Observable<string | null>;
  private readonly _recipeLabel$: Observable<string | null>;
  private readonly _currentRecipeId$: Observable<string | null>;
  private readonly _currentRecipeLabel$: Observable<string | null>;
  private readonly _state$: Observable<string>;
  private readonly _label$: Observable<string>;
  private readonly _description$: Observable<string>;

  constructor(
    situation: ISituation,
    terrainsSource: TerrainsSource,
    private readonly _api: API
  ) {
    super(situation);
    this._situation$ = new BehaviorSubject<ISituation>(situation);

    this._timeRemaining$ = this._situation$.pipe(
      map((s) => s.timeRemaining),
      distinctUntilChanged(),
      shareReplay(1)
    );
    this._recipeId$ = this._situation$.pipe(
      map((s) => s.recipeId),
      distinctUntilChanged(),
      shareReplay(1)
    );
    this._recipeLabel$ = this._situation$.pipe(
      map((s) => s.recipeLabel),
      distinctUntilChanged(),
      shareReplay(1)
    );
    this._currentRecipeId$ = this._situation$.pipe(
      map((s) => s.currentRecipeId),
      distinctUntilChanged(),
      shareReplay(1)
    );
    this._currentRecipeLabel$ = this._situation$.pipe(
      map((s) => s.currentRecipeLabel),
      distinctUntilChanged(),
      shareReplay(1)
    );
    this._state$ = this._situation$.pipe(
      map((s) => s.state),
      distinctUntilChanged(),
      shareReplay(1)
    );
    this._label$ = this._situation$.pipe(
      map((s) => s.label),
      distinctUntilChanged(),
      shareReplay(1)
    );
    this._description$ = this._situation$.pipe(
      map((s) => s.description),
      distinctUntilChanged(),
      shareReplay(1)
    );

    this._parentConnectedTerrain$ = combineLatest([
      this._situation$,
      terrainsSource.unlockedTerrains$,
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

  get id(): string {
    return this._situation$.value.id;
  }

  get payloadType(): "Situation" {
    return "Situation";
  }

  get parentTerrain$() {
    return this._parentConnectedTerrain$;
  }

  get timeRemaining$() {
    return this._timeRemaining$;
  }

  get recipeId$() {
    return this._recipeId$;
  }

  get recipeLabel$() {
    return this._recipeLabel$;
  }

  get currentRecipeId$() {
    return this._currentRecipeId$;
  }

  get currentRecipeLabel$() {
    return this._currentRecipeLabel$;
  }

  get state$() {
    return this._state$;
  }

  get iconUrl(): string {
    return `${this._api.baseUrl}/api/by-path/${this._situation$.value.path}/icon.png`;
  }

  get label$() {
    return this._label$;
  }

  get description$() {
    return this._description$;
  }

  _onUpdate(situation: ISituation) {
    if (situation.id !== this.id) {
      throw new Error("Invalid situation update: Wrong ID.");
    }

    this._situation$.next(situation);
  }
}
