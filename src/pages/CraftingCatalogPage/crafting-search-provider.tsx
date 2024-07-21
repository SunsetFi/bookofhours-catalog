import React from "react";

import { Observable, combineLatest, filter, map, switchMap } from "rxjs";

import { filterItemObservations, observeAllMap } from "@/observables";

import {
  matchesSearchQuery,
  PageSearchItemResult,
  PageSearchProviderPipe,
  SearchQuery,
} from "@/services/search";

import {
  CraftableModel,
  getCraftablesObservable,
} from "./crafting-data-source";
import { isNotNull } from "@/utils";
import OrchestrationIconButton from "@/components/OrchestrationIconButton";

export const craftingSearchProvider: PageSearchProviderPipe = (
  query$,
  container
) => {
  return query$.pipe(
    switchMap((query) =>
      getCraftablesObservable(container).pipe(
        filterItemObservations((item) => filterCraftableToQuery(query, item)),
        observeAllMap(craftableModelToSearchItem)
      )
    )
  );
};

function filterCraftableToQuery(
  query: SearchQuery,
  craftable: CraftableModel
): Observable<boolean> {
  return combineLatest([
    craftable.label$,
    craftable.skillLabel$,
    craftable.description$,
    craftable.aspects$,
  ]).pipe(
    map(([label, skillLabel, description, aspects]) => {
      return matchesSearchQuery(query, {
        freeText: [label, skillLabel, description].filter(isNotNull),
        aspects,
      });
    })
  );
}

function craftableModelToSearchItem(
  craftable: CraftableModel
): Observable<PageSearchItemResult> {
  return combineLatest([
    craftable.iconUrl$,
    craftable.label$,
    craftable.skillLabel$,
  ]).pipe(
    filter(
      ([iconUrl, label, skillLabel]) => !!iconUrl && !!label && !!skillLabel
    ),
    map(
      ([iconUrl, label, skillLabel]) =>
        ({
          iconUrl: iconUrl!,
          label: label!,
          secondaryText: `Skill: ${skillLabel}`,
          pathQuery: `filter-label=\"${encodeURIComponent(label!)}\"`,
          actions: [
            <OrchestrationIconButton
              interactivity="full"
              onClick={() => craftable.craft()}
            />,
          ],
        } satisfies PageSearchItemResult)
    )
  );
}
