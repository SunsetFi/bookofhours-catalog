import { mergeMap, of as observableOf } from "rxjs";

import { ModelWithParentTerrain } from "@/services/sh-model";

import { ObservableDataGridColumnDef } from "../types";

export function locationColumnDef<T extends ModelWithParentTerrain>(
  additional: Partial<
    Omit<ObservableDataGridColumnDef<T>, "field" | "observable">
  > = {}
): ObservableDataGridColumnDef<T> {
  return {
    headerName: "Location",
    width: 170,
    wrap: true,
    ...additional,
    observable: (item) =>
      item.parentTerrain$.pipe(
        mergeMap((terrain) => terrain?.label$ ?? observableOf(null))
      ),
  };
}
