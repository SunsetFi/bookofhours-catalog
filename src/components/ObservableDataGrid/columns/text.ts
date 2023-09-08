import { ObservableDataGridColumnDef } from "../types";
import { textFilter } from "../filters";

export function textColumnDef<T>(
  headerName: string,
  observable: ObservableDataGridColumnDef<T>["observable"],
  additional: Partial<
    Omit<ObservableDataGridColumnDef<T>, "field" | "observable">
  > = {}
): ObservableDataGridColumnDef<T> {
  return {
    flex: additional.width === undefined ? 1 : undefined,
    wrap: true,
    filter: textFilter(),
    sortable: (a: string, b: string) => {
      if (a === b) {
        return 0;
      }

      return a < b ? -1 : 1;
    },
    ...additional,
    headerName,
    observable,
  };
}
