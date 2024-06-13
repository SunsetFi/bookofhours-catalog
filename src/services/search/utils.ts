import { Observable, combineLatest, map, filter } from "rxjs";

import { ElementStackModel } from "../sh-game";

import { PageSearchItemResult } from "./types";
import { observeAllMap } from "@/observables";

export function mapElementStacksToSearchItems(
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
    elementStack.iconUrl$,
    elementStack.label$,
    produceQuery(elementStack),
  ]).pipe(
    filter(
      ([iconUrl, label, searchFragment]) =>
        iconUrl != null && label != null && searchFragment != null
    ),
    map(([iconUrl, label, pathQuery]) => {
      return {
        iconUrl: iconUrl,
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
