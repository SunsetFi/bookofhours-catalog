import React from "react";
import { Observable, combineLatest, map, of as observableOf } from "rxjs";
import { omit } from "lodash";

import {
  Box,
  CircularProgress,
  Table,
  TableContainer,
  TableHead,
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
  Cell,
  ColumnDef,
  ColumnFiltersState,
  HeaderGroup,
  InitialTableState,
  Row,
  SortingState,
  TableState,
  Updater,
  flexRender,
  getCoreRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Null$, observeAllMap } from "@/observables";
import { decorateObjectInstance } from "@/object-decorator";

import { useObservation } from "@/hooks/use-observation";

import HeaderCell from "./components/HeaderCell";

import {
  ObservableColumnDef,
  isObservableAccessorFnColumnDef,
  isObservableAccessorKeyColumnDef,
  isRowHeaderColumn,
} from "./types";

export interface ObservableDataGridProps<T extends {}> {
  sx?: SxProps;
  filters?: Record<string, any>;
  defaultSortColumn?: string;
  sorting?: SortingState;
  columns: ObservableColumnDef<T, any>[];
  items$: Observable<readonly T[]>;
  autoFocus?: boolean;
  ["aria-labelledby"]?: string;
  getItemKey?(item: T, index: number): string;
  onFiltersChanged?(filters: Record<string, any>): void;
  onSortingChanged?(sorting: SortingState): void;
}

const initialState: InitialTableState = {
  pagination: {
    pageSize: 25,
  },
};

function ObservableDataGrid<T extends {}>({
  sx,
  filters,
  defaultSortColumn,
  columns,
  sorting,
  items$,
  autoFocus,
  ["aria-labelledby"]: ariaLabelledBy,
  getItemKey = (item, index) => String(index),
  onFiltersChanged,
  onSortingChanged,
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

  const state = React.useMemo<Partial<TableState>>(
    () => ({
      sorting: sorting ?? uncontrolledSorting,
      columnFilters: filters ? recordToFilter(filters) : undefined,
    }),
    [sorting, uncontrolledSorting, filters]
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

  const data = useObservation(
    () =>
      items$.pipe(
        observeAllMap((item, index) =>
          itemToRow(item, index, columns, getItemKey)
        )
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
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  const parentRef = React.useRef<HTMLDivElement>(null);

  const headerGroups = table.getHeaderGroups();

  const rows = table.getRowModel().rows;

  const tableBody = React.useMemo(() => {
    // FIXME: Because of the way firefox accessibility works, highlighting an item with a screen reader will scroll it to the top of its container.
    // This is actually a problem, as the top of the container has our stick header overlayed.
    // We want then to have our body scroll, not our table.  But i'm not sure as of yet how to pull that off, as table styling is a strange and fickle thing.
    return (
      <TableBody tabIndex={0} autoFocus={autoFocus}>
        {rows.map((row) => {
          return <ObservableTableRow key={row.id} row={row} />;
        })}
      </TableBody>
    );
  }, [rows, autoFocus]);

  const totalColumns = table.getHeaderGroups()[0].headers.length;

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

function autoColumnProperty<T>(
  column: ObservableColumnDef<T>,
  index: number
): string {
  if (column.id) {
    return `col::${column.id}:${index}`;
  } else if (typeof column.header === "string") {
    return `col::${column.header}:${index}`;
  } else {
    return `col::unknown:${index}`;
  }
}

function observableToColumnDef<T extends {}>(
  observableColumn: ObservableColumnDef<T>,
  index: number
): ColumnDef<Record<string, any>> {
  if (
    isObservableAccessorKeyColumnDef(observableColumn) ||
    isObservableAccessorFnColumnDef(observableColumn)
  ) {
    const accessorKey = autoColumnProperty(observableColumn, index);
    return {
      ...omit(observableColumn, ["observationKey", "observationFn"]),
      accessorKey,
    } as any;
  }

  // TODO: Process group columns.
  // This will throw off our index, so we need to track index
  // externally.

  return observableColumn as any;
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
        const property = autoColumnProperty(columns[i], i);
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

const ObservableTableHeader = ({
  headerGroups,
}: {
  headerGroups: HeaderGroup<Record<string, any>>[];
}) => {
  return (
    <TableHead>
      {headerGroups.map((group) => (
        <TableRow key={group.id}>
          {group.headers.map((header) => (
            <HeaderCell key={header.id} header={header} />
          ))}
        </TableRow>
      ))}
    </TableHead>
  );
};

const ObservableTableRow = ({ row }: { row: Row<Record<string, any>> }) => {
  return (
    <TableRow>
      {row.getVisibleCells().map((cell) => (
        <ObservableTableCell key={cell.id} cell={cell} />
      ))}
    </TableRow>
  );
};

const ObservableTableCell = ({
  cell,
}: {
  cell: Cell<Record<string, any>, unknown>;
}) => {
  // The cells are not observable, so we need to rerender here when the value changes.
  // There doesn't seem to be anything else in the context that we need to rerender for.
  const value = cell.getContext().getValue();

  const isRowHeader = isRowHeaderColumn(cell.column.columnDef);
  return React.useMemo(
    () => (
      <TableCell component={isRowHeader ? "th" : "td"}>
        {flexRender(cell.column.columnDef.cell, cell.getContext())}
      </TableCell>
    ),
    [cell.column.columnDef.cell, isRowHeader, value]
  );
};

export default ObservableDataGrid;
