import { map, switchMap } from "rxjs";

import { provisionsAspects } from "@/aspects";
import { filterItemObservations } from "@/observables";

import {
  PageSearchProviderPipe,
  elementStackMatchesQuery,
  mapElementStacksToSearchItems,
} from "@/services/search";
import { TokensSource, filterHasAnyAspect } from "@/services/sh-game";

export const provisionsSearchProvider: PageSearchProviderPipe = (
  query$,
  container
) =>
  query$.pipe(
    switchMap((query) =>
      container.get(TokensSource).visibleElementStacks$.pipe(
        filterHasAnyAspect(provisionsAspects),
        filterItemObservations((item) => elementStackMatchesQuery(query, item)),
        mapElementStacksToSearchItems((element) =>
          element.label$.pipe(
            map((label) =>
              label ? `label=\"${encodeURIComponent(label)}\"` : null
            )
          )
        )
      )
    )
  );
