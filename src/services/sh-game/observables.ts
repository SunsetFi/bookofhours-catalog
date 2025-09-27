import { Observable, map } from "rxjs";
import { Aspects, SpaceOccupation } from "secrethistories-api";

import { filterItemObservations } from "@/observables";
import { tokenPathContainsChild } from "@/utils";

import { ModelWithAspects } from "./types";

import { ElementStackModel } from "./token-models/ElementStackModel";
import { TokenModel } from "./token-models/TokenModel";

export function filterTokenInPath(path: string | string[]) {
  return <T extends TokenModel>(source: Observable<readonly T[]>) => {
    return source.pipe(
      filterItemObservations((element) =>
        element.path$.pipe(
          map((elementPath) => {
            if (Array.isArray(path)) {
              return path.some((p) => tokenPathContainsChild(p, elementPath));
            } else {
              return tokenPathContainsChild(path, elementPath);
            }
          }),
        ),
      ),
    );
  };
}

export function filterTokenNotInPath(path: string | string[]) {
  return <T extends TokenModel>(source: Observable<readonly T[]>) => {
    return source.pipe(
      filterItemObservations((element) =>
        element.path$.pipe(
          map((elementPath) => {
            if (Array.isArray(path)) {
              return path.every((p) => !tokenPathContainsChild(p, elementPath));
            } else {
              return !tokenPathContainsChild(path, elementPath);
            }
          }),
        ),
      ),
    );
  };
}

export function filterElementId(id: string | ((id: string) => boolean)) {
  return <T extends ElementStackModel>(source: Observable<readonly T[]>) => {
    return source.pipe(
      filterItemObservations((element) =>
        element.elementId$.pipe(
          map((elementId) => {
            if (typeof id === "string") {
              return elementId === id;
            } else {
              return id(elementId);
            }
          }),
        ),
      ),
    );
  };
}

export function filterOccupiesSpace(space: SpaceOccupation) {
  return <T extends TokenModel>(source: Observable<readonly T[]>) => {
    return source.pipe(
      filterItemObservations((element) =>
        element.occupiesSpaceAs$.pipe(
          map((occupies) => {
            return occupies === space;
          }),
        ),
      ),
    );
  };
}

export function filterDoesNotOccupySpace(
  space: SpaceOccupation | readonly SpaceOccupation[],
) {
  return <T extends TokenModel>(source: Observable<readonly T[]>) => {
    return source.pipe(
      filterItemObservations((element) =>
        element.occupiesSpaceAs$.pipe(
          map((occupies) => {
            if (Array.isArray(space)) {
              return !space.includes(occupies);
            } else {
              return occupies !== space;
            }
          }),
        ),
      ),
    );
  };
}

export function filterHasAnyAspect(
  match: string | readonly string[] | ((aspectId: string) => boolean),
) {
  return <T extends ModelWithAspects>(
    source: Observable<readonly T[]>,
  ): Observable<readonly T[]> => {
    return source.pipe(
      filterItemObservations((element) =>
        element.aspects$.pipe(
          map((elementAspects) => {
            let found = false;

            if (Array.isArray(match)) {
              found = Object.keys(elementAspects)
                .filter((key) => elementAspects[key] > 0)
                .some((item) => match.includes(item));
            } else if (typeof match === "string") {
              found = elementAspects[match] > 0;
            } else if (typeof match === "function") {
              found = Object.keys(elementAspects)
                .filter((key) => elementAspects[key] > 0)
                .some((item) => match(item));
            }

            return found;
          }),
        ),
      ),
    );
  };
}

export function filterHasNoneOfAspect(match: string | readonly string[]) {
  if (typeof match === "string") {
    match = [match];
  }

  return <T extends ModelWithAspects>(source: Observable<readonly T[]>) => {
    return source.pipe(
      filterItemObservations((element) =>
        element.aspects$.pipe(
          map((elementAspects) =>
            match.every(
              (item) =>
                elementAspects[item] == null || elementAspects[item] === 0,
            ),
          ),
        ),
      ),
    );
  };
}

export function filterMatchesRequirements(requirements: Aspects) {
  return <T extends ModelWithAspects>(source: Observable<readonly T[]>) => {
    return source.pipe(
      filterItemObservations((element) =>
        element.aspects$.pipe(
          map((aspects) =>
            Object.keys(requirements).some(
              (key) => aspects[key] >= requirements[key],
            ),
          ),
        ),
      ),
    );
  };
}

export function filterMatchesEssentials(essentials: Aspects) {
  return <T extends ModelWithAspects>(source: Observable<readonly T[]>) => {
    return source.pipe(
      filterItemObservations((element) =>
        element.aspects$.pipe(
          map((aspects) =>
            Object.keys(essentials).every(
              (key) => aspects[key] >= essentials[key],
            ),
          ),
        ),
      ),
    );
  };
}

export function filterMatchesForbiddens(forbiddens: Aspects) {
  return <T extends ModelWithAspects>(source: Observable<readonly T[]>) => {
    return source.pipe(
      filterItemObservations((element) =>
        element.aspects$.pipe(
          map((aspects) =>
            Object.keys(forbiddens).every(
              (key) => aspects[key] == null || aspects[key] === 0,
            ),
          ),
        ),
      ),
    );
  };
}
