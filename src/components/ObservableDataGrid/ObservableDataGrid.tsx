import React from "react";
import { Observable, combineLatest, map, of as observableOf } from "rxjs";
import { omit } from "lodash";

import {
  Box,
  CircularProgress,
  Table,
  TableContainer,
  TableBody,
  TableFooter,
  TableCell,
  TableRow,
  Typography,
  Pagination,
  useTheme,
  SxProps,
} from "@mui/material";

import {
  ColumnDef,
  ColumnFiltersState,
  InitialTableState,
  SortingState,
  VisibilityState,
  TableState,
  Updater,
  getCoreRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { delayFirstValue, Null$, observeAllMap } from "@/observables";
import { decorateObjectInstance } from "@/object-decorator";

import { useObservation } from "@/hooks/use-observation";

import {
  ObservableColumnDef,
  isObservableAccessorFnColumnDef,
  isObservableAccessorKeyColumnDef,
} from "./types";

import ObservableTableHeader from "./components/ObservableTableHeader";
import ObservableTableRow from "./components/ObservableTableRow";
import ConfigureTableButton from "./components/ConfigureTableButton";

export interface ObservableDataGridProps<T extends {}> {
  sx?: SxProps;
  filters?: Record<string, any>;
  defaultSortColumn?: string;
  sorting?: SortingState;
  columns: ObservableColumnDef<T, any>[];
  visibleColumnIds?: string[];
  items$: Observable<readonly T[]>;
  autoFocus?: boolean;
  ["aria-labelledby"]?: string;
  getItemKey?(item: T, index: number): string;
  onFiltersChanged?(filters: Record<string, any>): void;
  onSortingChanged?(sorting: SortingState): void;
  onVisibleColumnIdsChanged?(visibleColumnIds: string[]): void;
}

const initialState: InitialTableState = {
  pagination: {
    pageSize: 10,
  },
};

function ObservableDataGrid<T extends {}>({
  sx,
  filters,
  defaultSortColumn,
  columns,
  visibleColumnIds,
  sorting,
  items$,
  autoFocus,
  ["aria-labelledby"]: ariaLabelledBy,
  getItemKey = (item, index) => String(index),
  onFiltersChanged,
  onSortingChanged,
  onVisibleColumnIdsChanged,
}: ObservableDataGridProps<T>) {
  const theme = useTheme();

  const tableColumns = React.useMemo(
    // FIXME: We need to process the observables in group columns too.
    () => columns.map(observableToColumnDef),
    [columns]
  );

  const [uncontrolledSorting, setUncontrolledSorting] =
    React.useState<SortingState>(
      defaultSortColumn
        ? [
            {
              id: defaultSortColumn,
              desc: false,
            },
          ]
        : []
    );

  const [uncontrolledVisibleColumnIds, setUncontrolledVisibleColumnIds] =
    React.useState<string[]>([]);

  React.useEffect(() => {
    setUncontrolledVisibleColumnIds(tableColumns.map((x) => x.id!));
  }, [tableColumns]);

  const allColumnIds = React.useMemo(
    () => tableColumns.map((c) => c.id!),
    [tableColumns]
  );
  const resolvedVisibleColumnIds =
    visibleColumnIds ?? uncontrolledVisibleColumnIds;

  const state = React.useMemo<Partial<TableState>>(
    () => ({
      sorting: sorting ?? uncontrolledSorting,
      columnFilters: filters ? recordToFilter(filters) : undefined,
      columnVisibility: allColumnIds.reduce((acc, id) => {
        acc[id] = resolvedVisibleColumnIds.includes(id);
        return acc;
      }, {} as Record<string, boolean>),
    }),
    [
      sorting,
      uncontrolledSorting,
      filters,
      allColumnIds,
      resolvedVisibleColumnIds,
    ]
  );

  const setSorting = React.useCallback(
    (updater: Updater<SortingState>) => {
      let newValue = sorting ?? uncontrolledSorting;
      if (typeof updater === "function") {
        newValue = updater(newValue);
      } else {
        newValue = updater;
      }

      if (onSortingChanged) {
        onSortingChanged(newValue);
      } else {
        setUncontrolledSorting(newValue);
      }
    },
    [sorting, uncontrolledSorting, onSortingChanged]
  );

  const setVisibility = React.useCallback(
    (updater: Updater<VisibilityState>) => {
      let previousValue = visibleColumnIds ?? uncontrolledVisibleColumnIds;

      let newObject = allColumnIds.reduce((acc, id) => {
        acc[id] = previousValue.includes(id);
        return acc;
      }, {} as Record<string, boolean>);
      if (typeof updater === "function") {
        newObject = updater(newObject);
      } else {
        newObject = updater;
      }

      const newValue = allColumnIds.filter((key) => newObject[key]);

      if (onVisibleColumnIdsChanged) {
        onVisibleColumnIdsChanged(newValue);
      } else {
        setUncontrolledVisibleColumnIds(newValue);
      }
    },
    [
      visibleColumnIds,
      uncontrolledVisibleColumnIds,
      allColumnIds,
      onVisibleColumnIdsChanged,
    ]
  );

  const data = useObservation(
    () =>
      items$.pipe(
        observeAllMap((item, index) =>
          itemToRow(item, index, columns, getItemKey)
        ),
        // Our data is huge and takes a while to render,
        // so make the whole app more performant by waiting to render the first value
        // until after the first render.
        delayFirstValue(1)
      ),
    [items$, columns],
    {
      profileName: "ObservableDataGrid.Data",
    }
  );

  const onTableFiltersChanged = React.useCallback(
    (value: Updater<ColumnFiltersState>) => {
      if (filters == null || onFiltersChanged == null) {
        return;
      }

      if (typeof value === "function") {
        value = value(recordToFilter(filters));
      }

      onFiltersChanged(filterToRecord(value));
    },
    [onFiltersChanged, filters]
  );

  const table = useReactTable({
    data: data ?? [],
    columns: tableColumns,
    state,
    initialState,
    getRowId: (row) => row["_rowId"],
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: onTableFiltersChanged,
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onColumnVisibilityChange: setVisibility,
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  const parentRef = React.useRef<HTMLDivElement>(null);

  const headerGroups = table.getHeaderGroups();

  const rows = table.getRowModel().rows;

  const totalColumns = table.getHeaderGroups()[0].headers.length;

  const tableBody = React.useMemo(() => {
    // FIXME: Because of the way firefox accessibility works, highlighting an item with a screen reader will scroll it to the top of its container.
    // This is actually a problem, as the top of the container has our stick header overlayed.
    // We want then to have our body scroll, not our table.  But i'm not sure as of yet how to pull that off, as table styling is a strange and fickle thing.
    return (
      <TableBody tabIndex={0} autoFocus={autoFocus}>
        {rows.map((row) => {
          return <ObservableTableRow key={row.id} row={row} />;
        })}
        <TableRow aria-role="presentation" sx={{ height: "100%" }}>
          <TableCell colSpan={totalColumns} />
        </TableRow>
      </TableBody>
    );
  }, [rows, autoFocus, totalColumns]);

  return (
    <TableContainer
      ref={parentRef}
      sx={{ width: "100%", height: "100%", ...sx }}
      aria-labelledby={ariaLabelledBy}
    >
      {!data && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
          }}
        >
          <CircularProgress color="inherit" />
        </Box>
      )}
      {data && (
        <Table
          sx={{
            tableLayout: "fixed",
            height: "100%",
          }}
          stickyHeader
        >
          <ObservableTableHeader headerGroups={headerGroups} />
          {tableBody}
          <TableFooter
            sx={{
              position: "sticky",
              bottom: 0,
              backgroundColor: theme.palette.background.default,
              // I have no idea why the footer expands to fill the empty table.
              // I also have no idea why this fixes it, or why the size is actually
              // chosen to be greater than 1px.
              // This 'works' in firefox and chrome.
              height: "1px",
            }}
          >
            {rows.length > 0 && (
              <TableRow>
                <TableCell colSpan={totalColumns}>
                  <Box
                    sx={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      position: "relative",
                    }}
                  >
                    <ConfigureTableButton table={table} />
                    <Box
                      sx={{
                        position: "absolute",
                        left: "50%",
                        transform: "translateX(-50%)",
                        top: 0,
                        bottom: 0,
                      }}
                    >
                      <Pagination
                        count={table.getPageCount()}
                        page={table.getState().pagination.pageIndex + 1}
                        onChange={(_, value) => table.setPageIndex(value - 1)}
                        variant="outlined"
                        shape="rounded"
                        showFirstButton
                        showLastButton
                      />
                    </Box>
                    <Typography variant="caption" sx={{ ml: "auto" }}>
                      Showing {rows.length} of {data?.length} items.
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableFooter>
        </Table>
      )}
    </TableContainer>
  );
}

function autoColumnId<T>(
  column: ObservableColumnDef<T>,
  index: number
): string {
  if (column.id) {
    return `col__${column.id}_${index}`;
  } else if (typeof column.header === "string") {
    return `col__${column.header}_${index}`;
  } else {
    return `col__unknown_${index}`;
  }
}

function observableToColumnDef<T extends {}>(
  observableColumn: ObservableColumnDef<T>,
  index: number
): ColumnDef<Record<string, any>> {
  let result = { ...observableColumn } as ColumnDef<Record<string, any>>;
  if (
    isObservableAccessorKeyColumnDef(observableColumn) ||
    isObservableAccessorFnColumnDef(observableColumn)
  ) {
    const accessorKey = autoColumnId(observableColumn, index);
    result = {
      ...omit(observableColumn, ["observationKey", "observationFn"]),
      accessorKey,
    } as any;
  }

  // TODO: Process group columns.
  // This will throw off our index, so we need to track index
  // externally.

  if (!result.id) {
    console.warn("Column has no id:", observableColumn);
    result.id = autoColumnId(observableColumn, index);
  }

  return result;
}

function observeColumn<TData extends {}>(
  column: ObservableColumnDef<TData>,
  item: TData,
  itemIndex: number
): Observable<any> {
  if (isObservableAccessorFnColumnDef(column)) {
    return column.observationFn(item, itemIndex);
  } else if (isObservableAccessorKeyColumnDef(column)) {
    return item[column.observationKey] as Observable<any>;
  } else if ("accessorKey" in column) {
    return observableOf((item as any)[column.accessorKey]);
  } else if ("accessorFn" in column) {
    return observableOf(column.accessorFn(item, itemIndex));
  }

  return Null$;
}

function flattenColumn<T>(
  column: ObservableColumnDef<T>
): ObservableColumnDef<T>[] {
  if ("columns" in column && Array.isArray(column.columns)) {
    return column.columns.flatMap(flattenColumn);
  }

  return [column];
}

function itemToRow<T extends {}>(
  item: T,
  itemIndex: number,
  columns: ObservableColumnDef<T>[],
  getItemKey: (item: T, index: number) => string
): Observable<Record<string, any>> {
  columns = columns.flatMap(flattenColumn);

  const observations = columns.map((column) =>
    observeColumn(column, item, itemIndex)
  );

  return combineLatest(observations).pipe(
    // This was here to help debounce changes, but with BatchingScheduler we dont seem to need it.
    // debounceTime(5),
    map((values) => {
      const decoration: Record<string, any> = {
        _rowId: getItemKey(item, itemIndex),
      };

      for (let i = 0; i < columns.length; i++) {
        const property = autoColumnId(columns[i], i);
        const value = values[i];
        decoration[property] = value;
      }

      return decorateObjectInstance(item, decoration);
    })
  );
}

function recordToFilter(record: Record<string, any>): ColumnFiltersState {
  return Object.keys(record).map((key) => ({
    id: key,
    value: record[key],
  }));
}
function filterToRecord(filter: ColumnFiltersState): Record<string, any> {
  const result = {} as Record<string, any>;
  for (const { id, value } of filter) {
    if (value != null) {
      result[id] = value;
    }
  }

  return result;
}

export default ObservableDataGrid;
