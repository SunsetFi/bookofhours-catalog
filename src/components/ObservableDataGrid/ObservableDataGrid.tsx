import React from "react";
import { Observable, combineLatest, map, of as observableOf } from "rxjs";
import { omit } from "lodash";

import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Table from "@mui/material/Table";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import TableFooter from "@mui/material/TableFooter";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import Pagination from "@mui/material/Pagination";

import { useTheme, type SxProps } from "@mui/material/styles";

import {
  ColumnDef,
  ColumnFiltersState,
  InitialTableState,
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

import { useVirtualizer } from "@tanstack/react-virtual";

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
import { RowHeight } from "./constants";

export interface ObservableDataGridProps<T extends {}> {
  sx?: SxProps;
  filters?: Record<string, any>;
  defaultSortColumn?: string;
  columns: ObservableColumnDef<T, any>[];
  items$: Observable<readonly T[]>;
  onFiltersChanged?(filters: Record<string, any>): void;
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
  columns: ObservableColumnDef<T>[]
): Observable<Record<string, any>> {
  columns = columns.flatMap(flattenColumn);

  // Note: In practice we don't use the observations for non-observables.
  // We need to have them passed in to make the indexes align though.
  return combineLatest(
    columns.map((column) => observeColumn(column, item, itemIndex))
  ).pipe(
    map((values) => {
      const decoration: Record<string, any> = {};

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
    if (value) {
      result[id] = value;
    }
  }

  return result;
}

const RowHeightFunc = () => RowHeight;

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
  items$,
  onFiltersChanged,
}: ObservableDataGridProps<T>) {
  const theme = useTheme();

  const tableColumns = React.useMemo(
    // FIXME: We need to process the observables in group columns too.
    () => columns.map(observableToColumnDef),
    [columns]
  );

  const [sorting, setSorting] = React.useState<SortingState>(
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
      sorting,
      columnFilters: filters ? recordToFilter(filters) : undefined,
    }),
    [sorting, filters]
  );

  const data = useObservation(
    () =>
      items$.pipe(
        observeAllMap((item, index) => itemToRow(item, index, columns))
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
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: onTableFiltersChanged,
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  const parentRef = React.useRef<HTMLDivElement>(null);

  // This is vestiegal now that we are using pagination, but i'm leaving it in.
  // It might yet come back into use if we add options to show more items per page, which will be useful outside of
  // a screen reader / accessibility context.
  const virtualizer = useVirtualizer({
    count: table.getRowModel().rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: RowHeightFunc,
    overscan: 20,
  });

  const virtualRows = virtualizer.getVirtualItems();

  const headerGroups = table.getHeaderGroups();

  const rows = table.getRowModel().rows;

  const tableElement = React.useMemo(() => {
    const totalColumns = table.getHeaderGroups()[0].headers.length;

    // Docs are pitiful for virtualizer...
    // The only functioning example (on react-table, not on react-virtual) has us use translateY() and
    // size the outer scrollbar content to be the total size.
    // We cannot use that with sticky headers as we will scroll past the table bounds well before we
    // get a fraction of the way into scrolling the table itself, causing the stickyness to go away.
    // We cannot fix this by setting the table height directly, as the stupid thing will try to stretch its rows out,
    // even though we set the table layout to fixed.
    // Anyway, this is the 'old way' of doing things (which currently is the only way documented on react-virtual's docs), which is slower and jankier
    // but makes the table be the correct height, preserving our sticky header.
    const paddingTop =
      virtualRows.length > 0 ? virtualRows?.[0]?.start || 0 : 0;
    const paddingBottom =
      virtualRows.length > 0
        ? virtualizer.getTotalSize() -
          (virtualRows?.[virtualRows.length - 1]?.end || 0)
        : 0;

    // FIXME: Because of the way firefox accessibility works, highlighting an item with a screen reader will scroll it to the top of its container.
    // This is actually a problem, as the top of the container has our stick header overlayed.
    // We want then to have our body scroll, not our table.  But i'm not sure as of yet how to pull that off, as table styling is a strange and fickle thing.
    return (
      <Table
        sx={{
          tableLayout: "fixed",
        }}
        stickyHeader
      >
        <TableHead>
          {headerGroups.map((group) => (
            <TableRow key={group.id}>
              {group.headers.map((header) => (
                <HeaderCell key={header.id} header={header} />
              ))}
            </TableRow>
          ))}
        </TableHead>
        <TableBody>
          {paddingTop > 0 && (
            // Its critical we use style and not sx here, as sx will generate a new classname every time this changes.
            <TableRow
              aria-hidden="true"
              style={{ height: `${paddingTop}px` }}
            />
          )}
          {virtualRows.map((virtualRow) => {
            const row = rows[virtualRow.index];
            return (
              <TableRow
                key={row.id}
                sx={{
                  height: `${virtualRow.size}px`,
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    component={
                      isRowHeaderColumn(cell.column.columnDef) ? "th" : "td"
                    }
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
          {paddingBottom > 0 && (
            // Its critical we use style and not sx here, as sx will generate a new classname every time this changes.
            <TableRow
              aria-hidden="true"
              style={{ height: `${paddingBottom}px` }}
            />
          )}
        </TableBody>
        <TableFooter
          sx={{
            position: "sticky",
            bottom: 0,
            backgroundColor: theme.palette.background.default,
          }}
        >
          {virtualRows.length > 0 && (
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
    );
  }, [rows, headerGroups, virtualRows]);

  return (
    <TableContainer
      ref={parentRef}
      sx={{ width: "100%", height: "100%", ...sx }}
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
          <CircularProgress />
        </Box>
      )}
      {data && <>{tableElement}</>}
    </TableContainer>
  );
}

export default ObservableDataGrid;
