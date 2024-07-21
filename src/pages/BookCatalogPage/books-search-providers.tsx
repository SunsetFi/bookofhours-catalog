import React from "react";

import { combineLatest, filter, map, Observable, switchMap } from "rxjs";

import { filterItemObservations, observeAllMap } from "@/observables";
import { isNotNull } from "@/utils";

import {
  elementStackToSearchItem,
  matchesSearchQuery,
  PageSearchItemResult,
  PageSearchProviderPipe,
} from "@/services/search";

import { ElementModel } from "@/services/sh-compendium";

import OrchestrationIconButton from "@/components/OrchestrationIconButton";

import { BookModel, getBooksObservable } from "./books-data-source";

export const bookCatalogSearchProvider: PageSearchProviderPipe = (
  query$,
  container
) => {
  const books$ = getBooksObservable(container);
  const memories$ = books$.pipe(
    observeAllMap((book) =>
      book.memory$.pipe(map((memory) => ({ book, memory })))
    ),
    map((items) => items.filter((x) => x.memory != null))
  ) as Observable<readonly { book: BookModel; memory: ElementModel }[]>;

  return query$.pipe(
    switchMap((query) =>
      combineLatest([
        books$.pipe(
          filterItemObservations((book) =>
            combineLatest([book.label$, book.description$, book.aspects$]).pipe(
              map(([label, description, aspects]) =>
                matchesSearchQuery(query, {
                  freeText: [label, description].filter(isNotNull),
                  aspects,
                })
              )
            )
          ),
          observeAllMap((book) =>
            elementStackToSearchItem(book, (book) =>
              book.label$.pipe(
                map((label) =>
                  label ? `filter-label=\"${encodeURIComponent(label)}\"` : null
                )
              )
            )
          )
        ),
        memories$.pipe(
          filterItemObservations(({ memory }) =>
            combineLatest([
              memory.label$,
              memory.description$,
              memory.aspects$,
            ]).pipe(
              map(([label, description, aspects]) =>
                matchesSearchQuery(query, {
                  freeText: [label, description].filter(isNotNull),
                  aspects,
                })
              )
            )
          ),
          observeAllMap(({ book, memory }) =>
            combineLatest([memory.iconUrl$, memory.label$, book.label$]).pipe(
              filter(
                ([iconUrl, label, bookLabel]) =>
                  iconUrl != null && label != null && bookLabel != null
              ),
              map(([iconUrl, label, bookLabel]) => {
                return {
                  iconUrl: iconUrl,
                  label: label!,
                  secondaryText: `Book: ${bookLabel}`,
                  pathQuery: `filter-memory=\"${encodeURIComponent(label!)}\"`,
                  actions: [
                    <OrchestrationIconButton
                      interactivity="full"
                      onClick={() => book.read()}
                    />,
                  ],
                } satisfies PageSearchItemResult;
              })
            )
          )
        ),
      ]).pipe(map((results) => results.flat()))
    )
  );
};
