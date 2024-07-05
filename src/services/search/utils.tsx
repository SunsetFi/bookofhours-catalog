import React from "react";

import { Observable, combineLatest, map, filter, switchMap } from "rxjs";

import { Visibility as VisibilityIcon } from "@mui/icons-material";

import {
  filterItemObservations,
  observeAllMap,
  switchMapIfNotNull,
} from "@/observables";
import { isNotNull } from "@/utils";

import {
  ElementStackModel,
  filterHasAnyAspect,
  TokensSource,
} from "../sh-game";

import { PageSearchItemResult, PageSearchProviderPipe } from "./types";
import { Compendium } from "../sh-compendium";

export type QueryProducer = (
  elementStack: ElementStackModel
) => Observable<string | null>;

export function createElementStackSearchProvider(
  filterAspect: string,
  produceQuery: QueryProducer
): PageSearchProviderPipe;
export function createElementStackSearchProvider(
  filterAspects: readonly string[],
  produceQuery: QueryProducer
): PageSearchProviderPipe;
export function createElementStackSearchProvider(
  filterAspects: (elementStack: ElementStackModel) => Observable<boolean>,
  produceQuery: QueryProducer
): PageSearchProviderPipe;
export function createElementStackSearchProvider(
  filter:
    | string
    | readonly string[]
    | ((elementStack: ElementStackModel) => Observable<boolean>),
  produceQuery: QueryProducer
): PageSearchProviderPipe {
  return (query$, container) => {
    const tokensSource = container.get(TokensSource);
    const compendium = container.get(Compendium);
    let filterPipe: (
      source: Observable<readonly ElementStackModel[]>
    ) => Observable<readonly ElementStackModel[]>;
    if (typeof filter === "string" || Array.isArray(filter)) {
      filterPipe = filterHasAnyAspect(filter);
    } else if (typeof filter === "function") {
      filterPipe = filterItemObservations(filter);
    }

    return query$.pipe(
      switchMap((query) =>
        tokensSource.visibleElementStacks$.pipe(
          filterPipe,
          filterItemObservations((item) =>
            elementStackMatchesQuery(query, item, compendium)
          ),
          mapElementStacksToSearchItems(produceQuery)
        )
      )
    );
  };
}

function mapElementStacksToSearchItems(
  produceQuery: (elementStack: ElementStackModel) => Observable<string | null>
) {
  return (source: Observable<ElementStackModel[]>) => {
    return source.pipe(
      observeAllMap((elementStack) =>
        elementStackToSearchItem(elementStack, produceQuery)
      )
    );
  };
}

function elementStackToSearchItem(
  elementStack: ElementStackModel,
  produceQuery: (elementStack: ElementStackModel) => Observable<string | null>
): Observable<PageSearchItemResult> {
  return combineLatest([
    produceQuery(elementStack),
    elementStack.iconUrl$,
    elementStack.label$,
    elementStack.parentTerrain$.pipe(
      switchMapIfNotNull((terrain) => terrain.label$)
    ),
  ]).pipe(
    filter(
      ([searchFragment, iconUrl, label]) =>
        iconUrl != null && label != null && searchFragment != null
    ),
    map(([pathQuery, iconUrl, label, location]) => {
      return {
        iconUrl: iconUrl,
        label: label!,
        secondaryText: location ?? undefined,
        pathQuery: pathQuery!,
        actions: [
          location
            ? {
                icon: <VisibilityIcon />,
                onClick: () => elementStack.focus(),
              }
            : null,
        ].filter(isNotNull),
      } satisfies PageSearchItemResult;
    })
  );
}

function elementStackMatchesQuery(
  query: string,
  elementStack: ElementStackModel,
  compendium: Compendium
): Observable<boolean> {
  return combineLatest([
    elementStack.label$,
    elementStack.aspects$.pipe(
      map((aspects) =>
        Object.keys(aspects).map((aspect) => compendium.getAspectById(aspect))
      ),
      filterItemObservations((aspect) =>
        aspect.hidden$.pipe(map((hidden) => !hidden))
      ),
      observeAllMap((aspect) => aspect.label$)
    ),
    elementStack.description$,
  ]).pipe(
    map(([label, aspects, description]) => {
      if (!label || !aspects || !description) {
        return false;
      }

      if (label.toLowerCase().includes(query)) {
        console.log(elementStack.id, "matches on label", label);
        return true;
      }

      if (description.toLowerCase().includes(query)) {
        console.log(elementStack.id, "matches on description", description);
        return true;
      }

      if (aspects.some((aspect) => aspect && aspect.includes(query))) {
        console.log(elementStack.id, "matches on aspects", aspects);
        return true;
      }

      return false;
    })
  );
}
