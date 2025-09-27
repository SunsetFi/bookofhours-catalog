import React from "react";
import { SortingState } from "@tanstack/react-table";
import { mapKeys, pickBy } from "lodash";

import { useQueryObjectState } from "@/hooks/use-queryobject";

import { ObservableDataGridProps } from "./ObservableDataGrid";

export type UseQuerySettings = Required<
  Pick<
    ObservableDataGridProps<any>,
    | "filters"
    | "sorting"
    | "visibleColumnIds"
    | "onFiltersChanged"
    | "onSortingChanged"
    | "onVisibleColumnIdsChanged"
  >
>;

export function useQuerySettings(): UseQuerySettings {
  const [queryObject, setQueryObject] = useQueryObjectState();

  const sorting = queryObject["sort-by"] ?? null;
  const filters = React.useMemo(
    () =>
      mapKeys(
        pickBy(queryObject, (_, key) => key.startsWith("filter-")),
        (_, key) => key.substring(7),
      ),
    [queryObject],
  );

  const visibleColumnIds = queryObject["columns"]?.split(",") ?? null;

  const onSortingChanged = React.useCallback(
    (sorting: SortingState) => {
      setQueryObject({
        ...mapKeys(filters, (_, key) => `filter-${key}`),
        ["sort-by"]: sorting ?? undefined,
        columns: visibleColumnIds?.join(",") ?? undefined,
      });
    },
    [setQueryObject, filters, visibleColumnIds],
  );

  const onFiltersChanged = React.useCallback(
    (filters: Record<string, string>) => {
      setQueryObject({
        ["sort-by"]: sorting ?? undefined,
        columns: visibleColumnIds?.join(",") ?? undefined,
        ...mapKeys(filters, (_, key) => `filter-${key}`),
      });
    },
    [setQueryObject, sorting, visibleColumnIds],
  );

  const onVisibleColumnIdsChanged = React.useCallback(
    (visibleColumnIds: string[]) => {
      setQueryObject({
        ["sort-by"]: sorting ?? undefined,
        columns: visibleColumnIds.join(",") ?? undefined,
        ...mapKeys(filters, (_, key) => `filter-${key}`),
      });
    },
    [setQueryObject, sorting, filters],
  );

  return {
    sorting,
    filters,
    visibleColumnIds,
    onSortingChanged,
    onFiltersChanged,
    onVisibleColumnIdsChanged,
  };
}
