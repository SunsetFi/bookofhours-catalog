import { BehaviorSubject, Observable, map } from "rxjs";
import { Situation as ISituation } from "secrethistories-api";

import { API } from "../sh-api";
import { TokenModel } from "./TokenModel";

export class SituationModel extends TokenModel {
  private readonly _situation$: BehaviorSubject<ISituation>;

  private readonly _timeRemaining$: Observable<number>;
  private readonly _recipeId$: Observable<string | null>;
  private readonly _recipeLabel$: Observable<string | null>;
  private readonly _currentRecipeId$: Observable<string | null>;
  private readonly _currentRecipeLabel$: Observable<string | null>;
  private readonly _state$: Observable<string>;
  private readonly _label$: Observable<string>;
  private readonly _description$: Observable<string>;

  constructor(situation: ISituation, private readonly _api: API) {
    super(situation);
    this._situation$ = new BehaviorSubject<ISituation>(situation);

    this._timeRemaining$ = this._situation$.pipe(map((s) => s.timeRemaining));
    this._recipeId$ = this._situation$.pipe(map((s) => s.recipeId));
    this._recipeLabel$ = this._situation$.pipe(map((s) => s.recipeLabel));
    this._currentRecipeId$ = this._situation$.pipe(
      map((s) => s.currentRecipeId)
    );
    this._currentRecipeLabel$ = this._situation$.pipe(
      map((s) => s.currentRecipeLabel)
    );
    this._state$ = this._situation$.pipe(map((s) => s.state));
    this._label$ = this._situation$.pipe(map((s) => s.label));
    this._description$ = this._situation$.pipe(map((s) => s.description));
  }

  get id(): string {
    return this._situation$.value.id;
  }

  get payloadType(): "Situation" {
    return "Situation";
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
