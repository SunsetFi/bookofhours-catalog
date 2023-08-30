import { Observable, map } from "rxjs";
import { Aspects, aspectsMatch } from "secrethistories-api";

import { filterItemObservations } from "@/observables";

import { ElementStackModel } from "./ElementStackModel";

export function filterHasAspect(aspect: string) {
  return (source: Observable<readonly ElementStackModel[]>) => {
    return source.pipe(
      filterItemObservations((element) =>
        element.aspects$.pipe(map((aspects) => aspects[aspect] > 0))
      )
    );
  };
}

export function filterHasAspects(match: Aspects) {
  return (source: Observable<readonly ElementStackModel[]>) => {
    return source.pipe(
      filterItemObservations((element) =>
        element.aspects$.pipe(map((aspects) => aspectsMatch(aspects, match)))
      )
    );
  };
}

export function filterHasAnyAspect(match: string[]) {
  return (source: Observable<readonly ElementStackModel[]>) => {
    return source.pipe(
      filterItemObservations((element) =>
        element.aspects$.pipe(
          map((aspects) => match.some((item) => aspects[item] > 0))
        )
      )
    );
  };
}
