import { Observable, map, switchMap } from "rxjs";

import { filterItemObservations } from "@/observables";

import {
  PageSearchItemResult,
  PageSearchProviderPipe,
  elementStackMatchesQuery,
  mapElementStacksToSearchItems,
} from "@/services/search";
import { TokensSource, filterHasAnyAspect } from "@/services/sh-game";

export const bookCatalogSearchProvider: PageSearchProviderPipe = (
  query$,
  container
) => {
  const tokensSource = container.get(TokensSource);
  return query$.pipe(
    switchMap((query) => createQueryObservable(query, tokensSource))
  );
};

function createQueryObservable(
  query: string,
  tokensSource: TokensSource
): Observable<PageSearchItemResult[]> {
  return tokensSource.visibleElementStacks$.pipe(
    filterHasAnyAspect("readable"),
    filterItemObservations((item) => elementStackMatchesQuery(query, item)),
    mapElementStacksToSearchItems((element) =>
      element.label$.pipe(
        map((label) => (label ? `name=\"${encodeURIComponent(label)}\"` : null))
      )
    )
  );
}
