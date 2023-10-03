import { Observable, combineLatest, map, filter } from "rxjs";

import { ElementStackModel } from "../sh-game";

import { PageSearchItemResult, PageSearchProviderPipe } from "./types";
import { mapArrayItems, mapArrayItemsCached, observeAll } from "@/observables";
import { Container } from "microinject";

export function pageProviderFromPath(
  pageProvider: PageSearchProviderPipe,
  path: string
) {
  return (query: Observable<string>, container: Container) => {
    return pageProvider(query, container).pipe(
      mapArrayItems((item) => ({ ...item, path }))
    );
  };
}

export function mapElementStacksToSearchItems(
  produceQuery: (elementStack: ElementStackModel) => Observable<string | null>
) {
  return (source: Observable<ElementStackModel[]>) => {
    return source.pipe(
      mapArrayItemsCached((elementStack) =>
        elementStackToSearchItem(elementStack, produceQuery)
      ),
      observeAll()
    );
  };
}

function elementStackToSearchItem(
  elementStack: ElementStackModel,
  produceQuery: (elementStack: ElementStackModel) => Observable<string | null>
): Observable<PageSearchItemResult> {
  return combineLatest([elementStack.label$, produceQuery(elementStack)]).pipe(
    filter(
      ([label, searchFragment]) => label != null && searchFragment != null
    ),
    map(([label, pathQuery]) => {
      return {
        iconUrl: elementStack.iconUrl,
        label: label!,
        pathQuery: pathQuery!,
      };
    })
  );
}

export function elementStackMatchesQuery(
  query: string,
  elementStack: ElementStackModel
): Observable<boolean> {
  return combineLatest([
    elementStack.label$,
    elementStack.aspects$,
    elementStack.description$,
  ]).pipe(
    map(([label, aspects, description]) => {
      if (!label || !aspects || !description) {
        return false;
      }

      if (label.toLowerCase().includes(query)) {
        return true;
      }

      if (description.toLowerCase().includes(query)) {
        return true;
      }

      if (Object.keys(aspects).some((aspectId) => aspectId.includes(query))) {
        return true;
      }

      return false;
    })
  );
}
