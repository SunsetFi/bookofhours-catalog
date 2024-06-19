import { Observable, map } from "rxjs";
import {
  SpaceOccupation,
  SphereSpec,
  aspectsMatchSphereSpec,
} from "secrethistories-api";

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
          })
        )
      )
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
          })
        )
      )
    );
  };
}

export function filterElementId(id: string | ((id: string) => boolean)) {
  return <T extends ElementStackModel>(source: Observable<readonly T[]>) => {
    return source.pipe(
      filterItemObservations((element) =>
        element.elementId$.pipe(
          map((occupies) => {
            if (typeof id === "string") {
              return occupies === id;
            } else {
              return id(occupies);
            }
          })
        )
      )
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
          })
        )
      )
    );
  };
}

export function filterDoesNotOccupySpace(
  space: SpaceOccupation | readonly SpaceOccupation[]
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
          })
        )
      )
    );
  };
}

export function filterHasAnyAspect(
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

export function filterHasNoneOfAspect(match: readonly string[]) {
  return <T extends ModelWithAspects>(source: Observable<readonly T[]>) => {
    return source.pipe(
      filterItemObservations((element) =>
        element.aspects$.pipe(
          map((aspects) =>
            match.every((item) => aspects[item] == null || aspects[item] === 0)
          )
        )
      )
    );
  };
}
