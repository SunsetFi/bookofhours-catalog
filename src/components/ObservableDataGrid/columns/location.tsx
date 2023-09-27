import { mergeMapIfNotNull } from "@/observables";

import { ModelWithParentTerrain } from "@/services/sh-game";

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
      item.parentTerrain$.pipe(mergeMapIfNotNull((terrain) => terrain.label$)),
  };
}
