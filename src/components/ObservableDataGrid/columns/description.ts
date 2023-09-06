import { ModelWithDescription } from "@/services/sh-game";

import { ObservableDataGridColumnDef } from "../types";

import { textColumnDef } from "./text";

export function descriptionColumnDef<T extends ModelWithDescription>(
  additional: Partial<
    Omit<ObservableDataGridColumnDef<T>, "field" | "observable">
  > = {}
): ObservableDataGridColumnDef<T> {
  return textColumnDef("Description", (item) => item.description$, additional);
}
