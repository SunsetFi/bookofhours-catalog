import { map, switchMap } from "rxjs";

import { filterItemObservations } from "@/observables";

import { furnishingAspects } from "@/aspects";

import {
  PageSearchProviderPipe,
  elementStackMatchesQuery,
  mapElementStacksToSearchItems,
} from "@/services/search";
import { TokensSource, filterHasAnyAspect } from "@/services/sh-game";

export const furnishingsSearchProvider: PageSearchProviderPipe = (
  query$,
  container
) =>
  query$.pipe(
    switchMap((query) =>
      container.get(TokensSource).visibleElementStacks$.pipe(
        filterHasAnyAspect(furnishingAspects),
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
