import { Observable, map, switchMap } from "rxjs";
import { Container } from "microinject";

import { filterItemObservations, mapArrayItems } from "@/observables";

import {
  PageSearchProviderPipe,
  elementStackMatchesQuery,
  mapElementStacksToSearchItems,
} from "@/services/search";
import { TokensSource, filterHasAnyAspect } from "@/services/sh-game";

export const skillsSearchProvider: PageSearchProviderPipe = (
  query$,
  container
) =>
  query$.pipe(
    switchMap((query) =>
      container.get(TokensSource).visibleElementStacks$.pipe(
        filterHasAnyAspect("skill"),
        filterItemObservations((item) => elementStackMatchesQuery(query, item)),
        mapElementStacksToSearchItems((element) =>
          element.label$.pipe(
            map((label) =>
              label ? `name=\"${encodeURIComponent(label)}\"` : null
            )
          )
        )
      )
    )
  );

function pageProviderFromPath(
  pageProvider: PageSearchProviderPipe,
  path: string
) {
  return (query: Observable<string>, container: Container) => {
    return pageProvider(query, container).pipe(
      mapArrayItems((item) => ({ ...item, path }))
    );
  };
}
