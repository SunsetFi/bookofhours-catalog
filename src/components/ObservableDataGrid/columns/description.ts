import { ModelWithDescription } from "@/services/sh-model";

import { ObservableDataGridColumnDef } from "../types";
import { textFilter } from "../filters";

export function descriptionColumnDef<T extends ModelWithDescription>(
  additional: Partial<
    Omit<ObservableDataGridColumnDef<T>, "field" | "observable">
  > = {}
): ObservableDataGridColumnDef<T> {
  return {
    headerName: "Description",
    flex: 1,
    wrap: true,
    filter: textFilter(),
    ...additional,
    observable: (item) => item.description$,
  };
}
