import { Container, inject, injectable, singleton } from "microinject";
import {
  BehaviorSubject,
  Observable,
  asyncScheduler,
  combineLatest,
  filter,
  map,
  shareReplay,
  throttleTime,
} from "rxjs";

import { isNotNull } from "@/utils";

import { SearchItemResult } from "./types";
import providers from "./providers";

@injectable()
@singleton()
export class SearchService {
  private _lastQuery: string | null = null;

  private readonly _searchQueryInput$ = new BehaviorSubject<string | null>(
    null
  );

  private readonly _searchQueryResponse$ = this._searchQueryInput$.pipe(
    throttleTime(1000, asyncScheduler, { leading: false, trailing: true })
  );

  private readonly _searchQueryResponseNotEmpty$ =
    this._searchQueryResponse$.pipe(
      filter(isNotNull),
      filter((x) => x != ""),
      shareReplay(1)
    );

  constructor(@inject(Container) private readonly _container: Container) {}

  private _isOpen$: Observable<boolean> | null = null;
  get isOpen$() {
    if (!this._isOpen$) {
      this._isOpen$ = this._searchQueryInput$.pipe(map((x) => x !== null));
    }
    return this._isOpen$;
  }

  private _searchQuery$: Observable<string> | null = null;
  get searchQuery$(): Observable<string> {
    if (!this._searchQuery$) {
      this._searchQuery$ = this._searchQueryInput$.pipe(map((x) => x || ""));
    }
    return this._searchQuery$;
  }

  private _searchResults$: Observable<SearchItemResult[]> | null = null;
  get searchResults$() {
    if (!this._searchResults$) {
      const observables = providers.map((provider) =>
        provider(this._searchQueryResponseNotEmpty$, this._container)
      );
      this._searchResults$ = combineLatest(observables).pipe(
        map((results) => results.flat())
      );
    }

    return this._searchResults$;
  }

  setSearchQuery(query: string) {
    this._lastQuery = query;
    this._searchQueryInput$.next(query);
  }

  open() {
    if (this._searchQueryInput$.value == null) {
      this._searchQueryInput$.next(this._lastQuery ?? "");
    }
  }

  close() {
    this._searchQueryInput$.next(null);
  }
}
