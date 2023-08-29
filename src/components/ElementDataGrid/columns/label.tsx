import { ElementDataGridColumnDef } from "../types";

import { textFilter } from "../filters";

export function labelColumnDef(
  additional: Partial<
    Omit<ElementDataGridColumnDef, "field" | "observable">
  > = {}
): ElementDataGridColumnDef {
  return {
    headerName: "Name",
    width: 200,
    wrap: true,
    filter: textFilter(),
    ...additional,
    observable: "label$",
  };
}
