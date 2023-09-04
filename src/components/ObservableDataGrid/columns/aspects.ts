import { Observable, map } from "rxjs";
import { pick } from "lodash";
import { Aspects } from "secrethistories-api";

import { aspectsMagnitude } from "@/aspects";

import { ModelWithAspects } from "@/services/sh-model";

import { AspectsCell } from "../cells/aspects-list";
import { aspectsFilter } from "../filters/aspects";

import { ObservableDataGridColumnDef } from "../types";

export function aspectsColumnDef<T extends ModelWithAspects>(
  pickAspects: readonly string[],
  additional: Partial<ObservableDataGridColumnDef<T>> = {}
): ObservableDataGridColumnDef<T> {
  return aspectsObservableColumnDef(
    (element) => element.aspects$,
    pickAspects,
    additional
  );
}

export function aspectsObservableColumnDef<T>(
  source: (target: T) => Observable<Aspects>,
  pickAspects: readonly string[],
  additional: Partial<ObservableDataGridColumnDef<T>> = {}
): ObservableDataGridColumnDef<T> {
  return {
    headerName: "Aspects",
    width: 300,
    wrap: true,
    renderCell: AspectsCell,
    filter: aspectsFilter(pickAspects),
    sortable: (a, b) => aspectsMagnitude(a) - aspectsMagnitude(b),
    observable: (element) =>
      source(element).pipe(map((aspects) => pick(aspects, pickAspects))),
    ...additional,
  };
}
