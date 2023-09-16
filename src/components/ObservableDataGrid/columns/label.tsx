import { ModelWithLabel } from "@/services/sh-game";

import { ObservableDataGridColumnDef } from "../types";
import { textFilter } from "../filters";

export function labelColumnDef<T extends ModelWithLabel>(
  additional: Partial<
    Omit<ObservableDataGridColumnDef<T>, "field" | "observable">
  > = {}
): ObservableDataGridColumnDef<T> {
  return {
    headerName: "Name",
    width: 200,
    wrap: true,
    filter: textFilter("name"),
    ...additional,
    observable: (item) => item.label$,
  };
}
