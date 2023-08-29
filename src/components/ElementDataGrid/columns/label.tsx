import { ElementDataGridColumnDef } from "../types";

export function labelColumnDef(
  additional: Partial<
    Omit<ElementDataGridColumnDef, "field" | "observable">
  > = {}
): ElementDataGridColumnDef {
  return {
    headerName: "Name",
    width: 200,
    wrap: true,
    ...additional,
    observable: "label$",
  };
}
