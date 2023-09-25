import { Observable, map } from "rxjs";
import { SphereSpec } from "secrethistories-api";

import { filterItemObservations } from "@/observables";

import { ModelWithAspects } from "./types";

import { ElementStackModel } from "./token-models/ElementStackModel";

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

export function sphereMatchesToken(
  t: SphereSpec,
  input: ElementStackModel
): Observable<boolean> {
  return input.aspects$.pipe(
    map((aspects) => {
      for (const essential of Object.keys(t.essential)) {
        const expectedValue = t.essential[essential];
        const compareValue = aspects[essential];
        if (compareValue === undefined) {
          return false;
        } else if (compareValue < expectedValue) {
          return false;
        }
      }

      let foundRequired = false;
      for (const required of Object.keys(t.required)) {
        const expectedValue = t.required[required];
        const compareValue = aspects[required];
        if (compareValue === undefined) {
          continue;
        } else if (compareValue >= expectedValue) {
          foundRequired = true;
          break;
        }
      }
      if (!foundRequired) {
        return false;
      }

      for (const forbidden of Object.keys(t.forbidden)) {
        const expectedValue = t.forbidden[forbidden];
        const compareValue = aspects[forbidden];
        if (compareValue === undefined) {
          continue;
        } else if (compareValue >= expectedValue) {
          return false;
        }
      }

      return true;
    })
  );
}
