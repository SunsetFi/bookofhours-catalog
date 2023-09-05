import * as React from "react";

import { Observable, map } from "rxjs";
import { pick, pickBy } from "lodash";
import { Aspects } from "secrethistories-api";

import { aspectsMagnitude } from "@/aspects";

import { ModelWithAspects } from "@/services/sh-game";

import { AspectsCell } from "../cells/aspects-list";
import { aspectsFilter } from "../filters/aspects";

import { ObservableDataGridColumnDef } from "../types";

export interface AspectsColumnDefOptions<T>
  extends Partial<ObservableDataGridColumnDef<T>> {
  aspectIconSize?: number;
}

export function aspectsColumnDef<T extends ModelWithAspects>(
  pickAspects: readonly string[] | ((aspectId: string) => boolean),
  additional: AspectsColumnDefOptions<T> = {}
): ObservableDataGridColumnDef<T> {
  return aspectsObservableColumnDef(
    (element) => element.aspects$,
    pickAspects,
    additional
  );
}

export function aspectsObservableColumnDef<T>(
  source: (target: T) => Observable<Aspects>,
  pickAspects: readonly string[] | ((aspectId: string) => boolean),
  { aspectIconSize, ...additional }: AspectsColumnDefOptions<T> = {}
): ObservableDataGridColumnDef<T> {
  const observable = (element: T) =>
    source(element).pipe(
      map((aspects) =>
        typeof pickAspects === "function"
          ? pickBy(aspects, (_, key) => pickAspects(key))
          : pick(aspects, pickAspects)
      )
    );
  return {
    headerName: "Aspects",
    width: 300,
    wrap: true,
    renderCell: (props) => <AspectsCell iconSize={aspectIconSize} {...props} />,
    filter: aspectsFilter(
      typeof pickAspects === "function" ? "auto" : pickAspects
    ),
    sortable: (a, b) => aspectsMagnitude(a) - aspectsMagnitude(b),
    ...additional,
    observable,
  };
}
