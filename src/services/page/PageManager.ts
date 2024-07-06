import { injectable, singleton } from "microinject";
import { BehaviorSubject, Observable } from "rxjs";

@injectable()
@singleton()
export class PageManager {
  private readonly _title$ = new BehaviorSubject<string | null>(null);

  get title() {
    return this._title$.value;
  }

  get title$(): Observable<string | null> {
    return this._title$;
  }

  setTitle(title: string | null) {
    this._title$.next(title);
  }
}
