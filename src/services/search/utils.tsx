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

import {
  PageSearchItemResult,
  PageSearchProviderPipe,
  SearchQuery,
} from "./types";
import { Compendium, ElementModel } from "../sh-compendium";
import { Aspects } from "secrethistories-api";
import { IconButton } from "@mui/material";
import FocusIconButton from "@/components/FocusIconButton";

export type QueryProducer = (
  elementStack: ElementStackModel,
) => Observable<string | null>;

export function createElementStackSearchProvider(
  filterAspect: string,
  produceQuery: QueryProducer,
): PageSearchProviderPipe;
export function createElementStackSearchProvider(
  filterAspects: readonly string[],
  produceQuery: QueryProducer,
): PageSearchProviderPipe;
export function createElementStackSearchProvider(
  filterAspects: (elementStack: ElementStackModel) => Observable<boolean>,
  produceQuery: QueryProducer,
): PageSearchProviderPipe;
export function createElementStackSearchProvider(
  filter:
    | string
    | readonly string[]
    | ((elementStack: ElementStackModel) => Observable<boolean>),
  produceQuery: QueryProducer,
): PageSearchProviderPipe {
  return (query$, container) => {
    const tokensSource = container.get(TokensSource);
    let filterPipe: (
      source: Observable<readonly ElementStackModel[]>,
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
            elementStackMatchesQuery(query, item),
          ),
          mapElementStacksToSearchItems(produceQuery),
        ),
      ),
    );
  };
}

function mapElementStacksToSearchItems(
  produceQuery: (elementStack: ElementStackModel) => Observable<string | null>,
) {
  return (source: Observable<ElementStackModel[]>) => {
    return source.pipe(
      observeAllMap((elementStack) =>
        elementStackToSearchItem(elementStack, produceQuery),
      ),
    );
  };
}

export function elementStackToSearchItem(
  elementStack: ElementStackModel,
  produceQuery: (elementStack: ElementStackModel) => Observable<string | null>,
): Observable<PageSearchItemResult> {
  return combineLatest([
    produceQuery(elementStack),
    elementStack.iconUrl$,
    elementStack.label$,
    elementStack.parentTerrain$.pipe(
      switchMapIfNotNull((terrain) => terrain.label$),
    ),
  ]).pipe(
    filter(
      ([searchFragment, iconUrl, label]) =>
        iconUrl != null && label != null && searchFragment != null,
    ),
    map(([pathQuery, iconUrl, label, location]) => {
      return {
        iconUrl: iconUrl,
        label: label!,
        secondaryText: location ?? undefined,
        pathQuery: pathQuery!,
        actions: [
          location ? <FocusIconButton token={elementStack} /> : null,
        ].filter(isNotNull),
      } satisfies PageSearchItemResult;
    }),
  );
}

export function elementToSearchItem(
  element: ElementModel,
  produceQuery: (element: ElementModel) => Observable<string | null>,
): Observable<PageSearchItemResult> {
  return combineLatest([
    produceQuery(element),
    element.iconUrl$,
    element.label$,
  ]).pipe(
    filter(
      ([searchFragment, iconUrl, label]) =>
        iconUrl != null && label != null && searchFragment != null,
    ),
    map(([pathQuery, iconUrl, label]) => {
      return {
        iconUrl: iconUrl,
        label: label!,
        pathQuery: pathQuery!,
      } satisfies PageSearchItemResult;
    }),
  );
}

function elementStackMatchesQuery(
  query: SearchQuery,
  elementStack: ElementStackModel,
): Observable<boolean> {
  return combineLatest([
    elementStack.label$,
    elementStack.aspects$,
    elementStack.description$,
  ]).pipe(
    map(([label, aspects, description]) => {
      return matchesSearchQuery(query, {
        freeText: [label, description].filter(isNotNull),
        aspects,
      });
    }),
  );
}

export interface ItemSearchFacets {
  freeText?: string[];
  aspects?: Aspects;
}
export function matchesSearchQuery(
  query: SearchQuery,
  item: ItemSearchFacets,
): boolean {
  if (query.type === "and") {
    return query.queries.every((subQuery) =>
      matchesSearchQuery(subQuery, item),
    );
  }

  if (query.type === "text" && item.freeText) {
    return item.freeText.some((text) =>
      text.toLowerCase().includes(query.text),
    );
  }

  if (query.type === "aspect" && item.aspects) {
    return item.aspects[query.aspect] > 0;
  }

  return false;
}
