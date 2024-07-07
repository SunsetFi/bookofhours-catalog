import React from "react";

import ObservableDataGrid, {
  ObservableDataGridProps,
} from "./ObservableDataGrid";

export type IdentifierItem = { readonly id: string | number };
export type IdentifierItemDataGridProps<T extends IdentifierItem> = Omit<
  ObservableDataGridProps<T>,
  "getItemKey"
>;

function IdentifierItemDataGrid<T extends { readonly id: string | number }>(
  props: IdentifierItemDataGridProps<T>
) {
  return (
    <ObservableDataGrid<T> {...props} getItemKey={(item) => String(item.id)} />
  );
}

export default IdentifierItemDataGrid;
