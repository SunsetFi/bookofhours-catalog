import { Container, inject, injectable, singleton } from "microinject";
import {
  BehaviorSubject,
  Observable,
  combineLatest,
  filter,
  map,
  shareReplay,
  debounceTime,
} from "rxjs";

import { isNotNull } from "@/utils";

import providers from "./providers";
import { SearchItemResult } from "./types";

@injectable()
@singleton()
export class SearchService {
  private _lastQuery: string | null = null;

  private _searchQueryVersion = 0;
  private readonly _searchQueryInput$ = new BehaviorSubject<string | null>(
    null
  );

  private readonly _searchBusy$ = new BehaviorSubject(false);

  private readonly _searchQueryDebounced$ = this._searchQueryInput$.pipe(
    debounceTime(500)
  );

  private readonly _searchActiveQuery$: Observable<string>;

  private readonly _searchResults$: Observable<SearchItemResult[]>;

  constructor(@inject(Container) private readonly _container: Container) {
    this._searchActiveQuery$ = this._searchQueryDebounced$.pipe(
      filter(isNotNull),
      map((x) => x.trim()),
      filter((x) => x != ""),
      shareReplay(1)
    );

    this._searchResults$ = combineLatest(
      providers.map((provider) =>
        provider(this._searchActiveQuery$, this._container)
      )
    ).pipe(map((results) => results.flat()));

    let listeningVersion: number | null = null;
    this._searchQueryInput$.subscribe((q) => {
      listeningVersion = ++this._searchQueryVersion;
      this._searchBusy$.next(q !== "");
      console.log("Got search query", q);
    });
    this._searchResults$.subscribe((s) => {
      if (listeningVersion === this._searchQueryVersion) {
        this._searchBusy$.next(false);
        listeningVersion = null;
      }
      console.log("Got search results", s);
    });
  }

  private _isOpen$: Observable<boolean> | null = null;
  get isOpen$() {
    if (!this._isOpen$) {
      this._isOpen$ = this._searchQueryInput$.pipe(map((x) => x !== null));
    }
    return this._isOpen$;
  }

  get isBusy$(): Observable<boolean> {
    return this._searchBusy$;
  }

  private _searchQuery$: Observable<string> | null = null;
  get searchQuery$(): Observable<string> {
    if (!this._searchQuery$) {
      this._searchQuery$ = this._searchQueryInput$.pipe(map((x) => x || ""));
    }
    return this._searchQuery$;
  }

  get searchResults$() {
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
