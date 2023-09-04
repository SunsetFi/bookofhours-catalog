import * as React from "react";
import { Observable, map } from "rxjs";
import { Aspects } from "secrethistories-api";

import { aspectsMagnitude } from "@/aspects";

import { ObservableDataGridColumnDef } from "../types";

import AspectPresenceCell from "../cells/aspects-presence";

interface AspectPresenceElement {
  aspects$: Observable<Aspects> | Observable<readonly string[]>;
}

type AspectFilter = readonly string[] | ((aspectId: string) => boolean);
function includeAspect(aspectId: string, filter: AspectFilter) {
  if (Array.isArray(filter)) {
    return filter.includes(aspectId);
  } else {
    return (filter as any)(aspectId);
  }
}

export interface AspectPresenseOpts {
  display?: "label" | "none";
  orientation?: "horizontal" | "vertical";
}

export function aspectsPresenceColumnDef<T extends AspectPresenceElement>(
  allowedAspects: AspectFilter,
  { display = "label", orientation = "vertical" }: AspectPresenseOpts = {},
  additional: Partial<Omit<ObservableDataGridColumnDef<T>, "field">> = {}
): ObservableDataGridColumnDef<T> {
  let observable$ = (element: T) => {
    let root: Observable<Aspects | readonly string[]>;
    if (typeof additional.observable === "function") {
      root = additional.observable(element);
    } else if (typeof additional.observable === "string") {
      root = (element as any)[additional.observable];
    } else {
      root = (element as any).aspects$;
    }
    if (!root) {
      console.error("Failed to find observable for", additional);
    }

    return root.pipe(
      map((value) => {
        if (Array.isArray(value)) {
          return value.filter((aspectId) =>
            includeAspect(aspectId, allowedAspects)
          );
        } else if (value && typeof value === "object") {
          return Object.keys(value)
            .filter((x) => (value as any)[x] > 0)
            .filter((aspectId) => includeAspect(aspectId, allowedAspects));
        }
      })
    );
  };

  return {
    headerName: "Aspects",
    width: 145,
    wrap: true,
    sortable: (a, b) => aspectsMagnitude(a) - aspectsMagnitude(b),
    renderCell: (props) => (
      <AspectPresenceCell
        {...props}
        orientation={orientation}
        display={display}
      />
    ),
    ...additional,
    observable: observable$,
  };
}
