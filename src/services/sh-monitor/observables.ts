import { Observable, map } from "rxjs";

import { filterItemObservations } from "@/observables";

import { ElementStackModel } from "./ElementStackModel";

export function filterHasAspect(aspect: string) {
  return (source: Observable<readonly ElementStackModel[]>) => {
    return source.pipe(
      filterItemObservations((element) =>
        element.elementAspects$.pipe(map((aspects) => aspects[aspect] > 0))
      )
    );
  };
}
