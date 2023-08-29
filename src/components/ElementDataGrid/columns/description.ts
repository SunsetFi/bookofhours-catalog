import { ElementDataGridColumnDef } from "../types";
import { textFilter } from "../filters";

export function descriptionColumnDef(
  additional: Partial<
    Omit<ElementDataGridColumnDef, "field" | "observable">
  > = {}
): ElementDataGridColumnDef {
  return {
    headerName: "Description",
    flex: 1,
    wrap: true,
    filter: textFilter(),
    ...additional,
    observable: "description$",
  };
}
