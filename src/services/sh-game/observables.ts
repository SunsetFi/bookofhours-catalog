import { Observable, map } from "rxjs";

import { filterItemObservations } from "@/observables";

import { ModelWithAspects } from "./types";

export function filterHasAspect(
  aspect: string | readonly string[] | ((aspectId: string) => boolean)
) {
  return <T extends ModelWithAspects>(source: Observable<readonly T[]>) => {
    return source.pipe(
      filterItemObservations((element) =>
        element.aspects$.pipe(
          map((aspects) => {
            if (Array.isArray(aspect)) {
              return Object.keys(aspects)
                .filter((key) => aspects[key] > 0)
                .some((item) => aspect.includes(item));
            } else if (typeof aspect === "string") {
              return aspects[aspect] > 0;
            } else if (typeof aspect === "function") {
              return Object.keys(aspects)
                .filter((key) => aspects[key] > 0)
                .some((item) => aspect(item));
            }

            return false;
          })
        )
      )
    );
  };
}

export function filterHasAnyAspect(match: readonly string[]) {
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

export function filterHasNoneOfAspect(match: readonly string[]) {
  return <T extends ModelWithAspects>(source: Observable<readonly T[]>) => {
    return source.pipe(
      filterItemObservations((element) =>
        element.aspects$.pipe(
          map((aspects) => match.some((item) => aspects[item] <= 0))
        )
      )
    );
  };
}
