import { BehaviorSubject, Observable, distinctUntilChanged, map } from "rxjs";
import { Token } from "secrethistories-api";

export abstract class TokenModel {
  private readonly _id: string;
  private readonly _payloadType: Token["payloadType"];

  private readonly _token$: BehaviorSubject<Token>;

  constructor(token: Token) {
    this._id = token.id;
    this._payloadType = token.payloadType;
    this._token$ = new BehaviorSubject(token);
  }

  get id() {
    return this._id;
  }

  get payloadType() {
    return this._payloadType;
  }

  private _path$: Observable<string> | null = null;
  get path$() {
    if (!this._path$) {
      this._path$ = this._token$.pipe(
        map((t) => t.path),
        distinctUntilChanged()
      );
    }

    return this._path$;
  }

  get path() {
    return this._token$.value.path;
  }

  update(token: Token) {
    this._token$.next(token);
    this._onUpdate(token);
  }

  protected abstract _onUpdate(token: Token): void;
}
