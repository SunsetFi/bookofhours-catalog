import { map, switchMap } from "rxjs";

import { materialAspects } from "@/aspects";
import { filterItemObservations } from "@/observables";

import {
  PageSearchProviderPipe,
  elementStackMatchesQuery,
  mapElementStacksToSearchItems,
} from "@/services/search";
import { TokensSource, filterHasAnyAspect } from "@/services/sh-game";

export const materialsSearchProvider: PageSearchProviderPipe = (
  query$,
  container
) =>
  query$.pipe(
    switchMap((query) =>
      container.get(TokensSource).visibleElementStacks$.pipe(
        filterHasAnyAspect(materialAspects),
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
