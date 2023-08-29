import { ElementDataGridColumnDef } from "../types";

export function descriptionColumnDef(
  additional: Partial<
    Omit<ElementDataGridColumnDef, "field" | "observable">
  > = {}
): ElementDataGridColumnDef {
  return {
    headerName: "Description",
    flex: 1,
    wrap: true,
    ...additional,
    observable: "description$",
  };
}
