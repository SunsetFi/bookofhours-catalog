import React from "react";
import { SortingState } from "@tanstack/react-table";
import { omit, mapKeys, pickBy } from "lodash";

import { useQueryObjectState } from "@/hooks/use-queryobject";

import { ObservableDataGridProps } from "./ObservableDataGrid";

export type UseQuerySettings = Required<
  Pick<
    ObservableDataGridProps<any>,
    "filters" | "sorting" | "onFiltersChanged" | "onSortingChanged"
  >
>;

export function useQuerySettings(): UseQuerySettings {
  const [queryObject, setQueryObject] = useQueryObjectState();

  const sorting = queryObject["sort-by"] ?? null;
  const filters = React.useMemo(
    () =>
      mapKeys(
        pickBy(queryObject, (_, key) => key.startsWith("filter-")),
        (_, key) => key.substring(7)
      ),
    [queryObject]
  );

  const onSortingChanged = React.useCallback(
    (sorting: SortingState) => {
      setQueryObject({
        ...mapKeys(filters, (_, key) => `filter-${key}`),
        ["sort-by"]: sorting,
      });
    },
    [setQueryObject, filters]
  );

  const onFiltersChanged = React.useCallback(
    (filters: Record<string, string>) => {
      setQueryObject({
        ["sort-by"]: sorting,
        ...mapKeys(filters, (_, key) => `filter-${key}`),
      });
    },
    [setQueryObject, sorting]
  );

  return { sorting, filters, onSortingChanged, onFiltersChanged };
}
