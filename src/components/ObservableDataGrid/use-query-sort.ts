import React from "react";
import { ColumnSort, SortingState } from "@tanstack/react-table";
import { useQueryStringState } from "@/hooks/use-querystring";

export type UseQuerySort = [
  sorting: SortingState,
  onSortingChanged: (sorting: SortingState) => void
];

export function useQuerySort(): UseQuerySort {
  const [q, setQ] = useQueryStringState("sort");

  const sorting = React.useMemo(() => {
    if (!q) {
      return [];
    }

    const fragments = q.split(",");
    function fragmentToSort(fragment: string): ColumnSort {
      const [id, desc] = fragment.split(":");
      return {
        id,
        desc: desc === "desc",
      };
    }
    return fragments.map(fragmentToSort);
  }, [q]);

  const onSortingChanged = React.useCallback(
    (sorting: SortingState) => {
      const q = sorting.map(({ id, desc }) => `${id}:${desc ? "desc" : "asc"}`);
      setQ(q.join(",") || null);
    },
    [setQ]
  );

  return [sorting, onSortingChanged];
}
