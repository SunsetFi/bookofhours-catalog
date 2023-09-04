import * as React from "react";
import { map } from "rxjs";
import { pickBy } from "lodash";

import { aspectsMagnitude } from "@/aspects";

import { ModelWithAspects } from "@/services/sh-model";

import { ObservableDataGridColumnDef } from "../types";
import AspectPresenceCell from "../cells/aspects-presence";

type AspectFilter = readonly string[] | ((aspectId: string) => boolean);
function includeAspect(aspectId: string, filter: AspectFilter) {
  if (Array.isArray(filter)) {
    return filter.includes(aspectId);
  } else {
    return (filter as any)(aspectId);
  }
}

export interface AspectPresenseOpts {
  display?: "label" | "level" | "none";
}

export function aspectPresenceColumnDef<T extends ModelWithAspects>(
  allowedAspects: AspectFilter,
  { display = "level" }: AspectPresenseOpts = {},
  additional: Partial<
    Omit<ObservableDataGridColumnDef<T>, "field" | "observable">
  > = {}
): ObservableDataGridColumnDef<T> {
  return {
    headerName: "Aspects",
    width: 145,
    wrap: true,
    sortable: (a, b) => aspectsMagnitude(a) - aspectsMagnitude(b),
    renderCell: (props) => (
      <AspectPresenceCell
        {...props}
        allowedAspects={allowedAspects}
        display={display}
      />
    ),
    ...additional,
    observable: (element) =>
      element.aspects$.pipe(
        map((aspects) =>
          pickBy(aspects, (_, key) => includeAspect(key, allowedAspects))
        )
      ),
  };
}
