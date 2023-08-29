import { mergeMap, of as observableOf } from "rxjs";

import { ElementDataGridColumnDef } from "../types";

export function locationColumnDef(
  additional: Partial<
    Omit<ElementDataGridColumnDef, "field" | "observable">
  > = {}
): ElementDataGridColumnDef {
  return {
    headerName: "Location",
    width: 170,
    wrap: true,
    ...additional,
    observable: (elementStack) =>
      elementStack.parentTerrain$.pipe(
        mergeMap((terrain) => terrain?.label$ ?? observableOf(null))
      ),
  };
}
