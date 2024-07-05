import { Container, inject, injectable, singleton } from "microinject";
import {
  BehaviorSubject,
  Observable,
  combineLatest,
  filter,
  map,
  shareReplay,
  debounceTime,
  switchMap,
} from "rxjs";

import { isNotNull } from "@/utils";

import { Compendium } from "../sh-compendium";

import providers from "./providers";
import { SearchItemResult, SearchQuery } from "./types";

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

  private readonly _searchActiveQuery$: Observable<SearchQuery>;

  private readonly _searchResults$: Observable<SearchItemResult[]>;

  constructor(
    @inject(Container) private readonly _container: Container,
    @inject(Compendium) private readonly _compendium: Compendium
  ) {
    this._searchActiveQuery$ = this._searchQueryDebounced$.pipe(
      filter(isNotNull),
      map((x) => x.trim()),
      filter((x) => x != ""),
      switchMap((x) => this._parseSearchQuery(x)),
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
    });
    this._searchResults$.subscribe((s) => {
      if (listeningVersion === this._searchQueryVersion) {
        this._searchBusy$.next(false);
        listeningVersion = null;
      }
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

  private async _parseSearchQuery(query: string): Promise<SearchQuery> {
    query = query.toLowerCase();

    // This could be more complex in the future, using groupings and ORs and such
    const parseFragment = async (fragment: string): Promise<SearchQuery> => {
      const aspects = await this._compendium.searchAspects(fragment);
      const exact = aspects.find((x) => x.label.toLowerCase() === fragment);
      if (exact) {
        return {
          type: "aspect",
          aspect: exact.id,
        };
      }

      return {
        type: "text",
        text: fragment,
      };
    };

    const queries = await Promise.all(query.split(" ").map(parseFragment));

    return {
      type: "and",
      queries,
    };
  }
}
