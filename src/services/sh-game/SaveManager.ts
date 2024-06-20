import { inject, injectable, singleton } from "microinject";
import {
  BehaviorSubject,
  Observable,
  defer,
  from,
  retry,
  shareReplay,
} from "rxjs";
import { LegacyId, SaveInfo } from "secrethistories-api";

import { API } from "../sh-api";

@injectable()
@singleton()
export class SaveManager {
  private readonly _isLoading$ = new BehaviorSubject(false);
  private readonly _saves$: Observable<readonly SaveInfo[]>;

  constructor(@inject(API) private readonly _api: API) {
    this._saves$ = defer(() =>
      from(this._api.getSaves()).pipe(retry(), shareReplay(1))
    );
  }

  get saves$() {
    return this._saves$;
  }

  get isLoading$() {
    return this._isLoading$;
  }

  async newGame() {
    this._isLoading$.next(true);
    try {
      await this._api.startLegacy("librarian" as LegacyId);
    } finally {
      this._isLoading$.next(false);
    }
  }

  async loadSave(saveName: string): Promise<void> {
    this._isLoading$.next(true);
    try {
      await this._api.loadSave(saveName);
    } finally {
      this._isLoading$.next(false);
    }
  }
}