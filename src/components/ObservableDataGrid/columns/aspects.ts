import { map } from "rxjs";
import { pick } from "lodash";

import { aspectsMagnitude } from "@/aspects";

import { ModelWithAspects } from "@/services/sh-model/types";

import { AspectsCell } from "../cells/aspects-list";
import { aspectsFilter } from "../filters/aspects";

import { ObservableDataGridColumnDef } from "../types";

export function aspectsColumnDef<T extends ModelWithAspects>(
  pickAspects: readonly string[],
  additional: Partial<
    Omit<ObservableDataGridColumnDef<T>, "field" | "observable">
  > = {}
): ObservableDataGridColumnDef<T> {
  return {
    headerName: "Aspects",
    width: 300,
    wrap: true,
    renderCell: AspectsCell,
    filter: aspectsFilter(pickAspects),
    sortable: (a, b) => aspectsMagnitude(a) - aspectsMagnitude(b),
    ...additional,
    observable: (element) =>
      element.aspects$.pipe(map((aspects) => pick(aspects, pickAspects))),
  };
}
