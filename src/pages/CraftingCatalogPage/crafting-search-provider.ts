import { Observable, combineLatest, filter, map, mergeMap } from "rxjs";

import {
  filterItemObservations,
  mapArrayItemsCached,
  observeAll,
} from "@/observables";

import {
  PageSearchItemResult,
  PageSearchProviderPipe,
} from "@/services/search";

import {
  CraftableModel,
  getCraftablesObservable,
} from "./crafting-data-source";

export const craftingSearchProvider: PageSearchProviderPipe = (
  query$,
  container
) => {
  return query$.pipe(
    mergeMap((query) =>
      getCraftablesObservable(container).pipe(
        filterItemObservations((item) => filterCraftableToQuery(query, item)),
        mapArrayItemsCached((item) => craftableModelToSearchItem(item)),
        observeAll()
      )
    )
  );
};

function filterCraftableToQuery(
  query: string,
  craftable: CraftableModel
): Observable<boolean> {
  return combineLatest([
    craftable.label$,
    craftable.skillLabel$,
    craftable.description$,
    craftable.aspects$,
  ]).pipe(
    map(([label, skillLabel, description, aspects]) => {
      const labelMatch = label?.toLowerCase().includes(query.toLowerCase());
      const skillLabelMatch = skillLabel
        ?.toLowerCase()
        .includes(query.toLowerCase());
      const descriptionMatch = description
        ?.toLowerCase()
        .includes(query.toLowerCase());
      const aspectsMatch = Object.keys(aspects).some((aspectId) =>
        aspectId.includes(query)
      );

      return labelMatch || skillLabelMatch || descriptionMatch || aspectsMatch;
    })
  );
}

function craftableModelToSearchItem(
  craftable: CraftableModel
): Observable<PageSearchItemResult> {
  return combineLatest([craftable.iconUrl$, craftable.label$]).pipe(
    filter(([iconUrl, label]) => !!iconUrl && !!label),
    map(([iconUrl, label]) => ({
      iconUrl: iconUrl!,
      label: label!,
      pathQuery: `name=\"${encodeURIComponent(label!)}\"`,
    }))
  );
}
