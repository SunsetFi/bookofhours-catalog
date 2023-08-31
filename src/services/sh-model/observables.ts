import { Observable, map } from "rxjs";
import { Aspects, aspectsMatch } from "secrethistories-api";

import { filterItemObservations } from "@/observables";

import { ModelWithAspects } from "./types";

export function filterHasAspect(aspect: string) {
  return <T extends ModelWithAspects>(source: Observable<readonly T[]>) => {
    return source.pipe(
      filterItemObservations((element) =>
        element.aspects$.pipe(map((aspects) => aspects[aspect] > 0))
      )
    );
  };
}

export function filterHasAspects(match: Aspects) {
  return <T extends ModelWithAspects>(source: Observable<readonly T[]>) => {
    return source.pipe(
      filterItemObservations((element) =>
        element.aspects$.pipe(map((aspects) => aspectsMatch(aspects, match)))
      )
    );
  };
}

export function filterHasAnyAspect(match: string[]) {
  return <T extends ModelWithAspects>(source: Observable<readonly T[]>) => {
    return source.pipe(
      filterItemObservations((element) =>
        element.aspects$.pipe(
          map((aspects) => match.some((item) => aspects[item] > 0))
        )
      )
    );
  };
}
