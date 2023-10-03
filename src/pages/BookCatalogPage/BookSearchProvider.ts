import { Observable, map, mergeMap } from "rxjs";

import { filterItemObservations } from "@/observables";

import {
  PageSearchItemResult,
  PageSearchProviderPipe,
  elementStackMatchesQuery,
  mapElementStacksToSearchItems,
} from "@/services/search";
import { TokensSource, filterHasAspect } from "@/services/sh-game";

export const bookCatalogSearchProvider: PageSearchProviderPipe = (
  query$,
  container
) => {
  const tokensSource = container.get(TokensSource);
  return query$.pipe(
    mergeMap((query) => createQueryObservable(query, tokensSource))
  );
};

function createQueryObservable(
  query: string,
  tokensSource: TokensSource
): Observable<PageSearchItemResult[]> {
  return tokensSource.visibleElementStacks$.pipe(
    filterHasAspect("readable"),
    filterItemObservations((item) => elementStackMatchesQuery(query, item)),
    mapElementStacksToSearchItems((element) =>
      element.label$.pipe(
        map((label) => (label ? `name=\"${encodeURIComponent(label)}\"` : null))
      )
    )
  );
}
