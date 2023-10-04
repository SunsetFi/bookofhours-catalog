import * as React from "react";
import {
  BehaviorSubject,
  Observable,
  asapScheduler,
  combineLatest,
  map,
  of as observableOf,
  throttleTime,
} from "rxjs";
import { isEqual } from "lodash";

import type { SxProps } from "@mui/material";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";

import type { DataGridProps } from "@mui/x-data-grid";

import { DataGrid } from "@mui/x-data-grid/DataGrid";
import type { GridColDef } from "@mui/x-data-grid/models";

import {
  mapArrayItemsCached,
  observeAll,
  profileEnd,
  profileStart,
  useObservation,
} from "@/observables";

import ColumnHeader from "./components/ColumnHeader";

import { renderCellTextWrap } from "./cells/text-wrap";

import { ObservableDataGridColumnDef } from "./types";
import { FilterDispatchContext, FilterValueContext } from "./context";

export interface ObservableDataGridProps<T> {
  sx?: SxProps;
  filters?: Record<string, any>;
  columns: ObservableDataGridColumnDef<T>[];
  items$: Observable<readonly T[]>;
  onFiltersChanged?(filters: Record<string, any>): void;
}

const pageSizeOptions = [10, 25, 50];
const initialState = {
  pagination: { paginationModel: { pageSize: pageSizeOptions[2] } },
};

function itemToRow(
  item: any,
  columns: ObservableDataGridColumnDef<any>[]
): Observable<Record<string, any>> {
  const observables: Observable<any>[] = columns.map((column) => {
    if (column.field === "$item") {
      return observableOf(item);
    } else if (column.field) {
      return observableOf(item[column.field]);
    } else if (typeof column.observable === "string") {
      return item[column.observable];
    } else if (typeof column.observable === "function") {
      return column.observable(item);
    } else {
      return observableOf(undefined);
    }
  });

  return combineLatest(observables).pipe(
    map((values) => {
      const value: any = {
        id: item.id,
      };
      values.forEach((v, i) => {
        value[`column_${i}`] = v;
      });
      return value;
    })
  );
}

function ObservableDataGrid<T>({
  sx,
  filters,
  columns,
  items$,
  onFiltersChanged,
}: ObservableDataGridProps<T>) {
  // Uncontrolled filter value.
  const [internalFilterValue, internalFilterDispatch] = React.useState<
    Record<string, any>
  >({});

  // Pipe for debouncing the actual filter value to apply to the rows.
  const appliedFilterValue$ = React.useMemo(
    () => new BehaviorSubject<Record<string, any>>({}),
    []
  );

  // Filter value currently active, with defaults applied.
  const inputFilterValue = React.useMemo(() => {
    const value = { ...(filters ?? internalFilterValue) };

    // Apply defaults for filters that are not set.
    for (const column of columns) {
      if (!column.filter) {
        continue;
      }

      if (
        value[column.filter.key] === undefined &&
        column.filter?.defaultFilterValue != null
      ) {
        value[column.filter.key] = column.filter.defaultFilterValue;
      }
    }

    return value;
  }, [filters, internalFilterValue, columns]);

  // Run the filter through a debounce to allow performant typing.
  React.useEffect(() => {
    appliedFilterValue$.next(inputFilterValue);
  }, [inputFilterValue]);

  // Final debounced filter value to apply to the rows.
  const finalFilterValue =
    useObservation(
      () =>
        appliedFilterValue$.pipe(
          throttleTime(1000, asapScheduler, { leading: false, trailing: true }),
          map((inputValue) => {
            const value = { ...inputValue };

            // Apply defaults for filters that are not set.
            for (const column of columns) {
              if (!column.filter) {
                continue;
              }

              if (
                value[column.filter.key] === undefined &&
                column.filter?.defaultFilterValue != null
              ) {
                value[column.filter.key] = column.filter.defaultFilterValue;
              }
            }

            return value;
          })
        ),
      [appliedFilterValue$, columns]
    ) ?? inputFilterValue;

  // Filter setter function
  const filterDispatch = React.useCallback(
    (key: string, value: any) => {
      const forward = onFiltersChanged ?? internalFilterDispatch;

      const newValue = { ...(filters ?? appliedFilterValue$.value) };

      // Do not store default filter values.
      let isDifferent = false;
      for (const filter of columns
        .map((x) => x.filter)
        .filter((x) => x != null && x.key === key)) {
        if (!isEqual(filter!.defaultFilterValue, value)) {
          isDifferent = true;
          break;
        }
      }

      if (isDifferent) {
        newValue[key] = value;
      } else {
        delete newValue[key];
      }

      forward(newValue);
    },
    [
      filters,
      appliedFilterValue$,
      onFiltersChanged,
      internalFilterDispatch,
      columns,
    ]
  );

  const rows =
    useObservation(
      () =>
        items$.pipe(
          mapArrayItemsCached((element) => itemToRow(element, columns)),
          profileStart("ObservableDataGrid.observeAll"),
          observeAll(),
          profileEnd("ObservableDataGrid.observeAll")
        ),
      [items$, columns]
    ) ?? undefined;

  const colDefs = React.useMemo(() => {
    if (!rows) {
      return undefined;
    }
    function getColDef(
      column: ObservableDataGridColumnDef<T>,
      index: number
    ): GridColDef {
      const { field, observable, filter, sortable, ...colDef } = column;
      const columnValues = rows!.map((row) => row[`column_${index}`]);
      return {
        renderCell: column.wrap ? renderCellTextWrap : undefined,
        filterable: false,
        disableColumnMenu: true,
        ...colDef,
        sortable: Boolean(sortable),
        sortComparator: typeof sortable === "function" ? sortable : undefined,
        field: `column_${index}`,
        renderHeader: ({ colDef }) => (
          <ColumnHeader
            columnValues={columnValues}
            filter={filter}
            colDef={colDef}
          />
        ),
      };
    }

    return columns.map(getColDef);
  }, [columns, rows]);

  const filteredRows = React.useMemo(
    () =>
      rows?.filter((element) => {
        for (let i = 0; i < columns.length; i++) {
          const { filter } = columns[i];
          if (!filter) {
            continue;
          }

          if (
            !filter.filterValue(
              element[`column_${i}`],
              finalFilterValue[filter.key]
            )
          ) {
            return false;
          }
        }

        return true;
      }),
    [columns, rows, finalFilterValue]
  );

  return (
    // Stupid box because stupid datagrid expands bigger than its 100% size.
    <Box sx={{ overflow: "hidden", ...sx }}>
      <FilterDispatchContext.Provider value={filterDispatch}>
        <FilterValueContext.Provider value={inputFilterValue}>
          {!filteredRows && (
            <Box
              sx={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CircularProgress />
            </Box>
          )}
          {filteredRows && colDefs && (
            <DeferredDataGrid
              sx={{ width: "100%", height: "100%" }}
              columns={colDefs}
              rows={filteredRows}
              rowHeight={100}
              density="comfortable"
              initialState={initialState}
              pageSizeOptions={pageSizeOptions}
            />
          )}
        </FilterValueContext.Provider>
      </FilterDispatchContext.Provider>
    </Box>
  );
}

const DeferredDataGrid = ({ sx, ...props }: DataGridProps) => {
  const deferredColumns = React.useDeferredValue(props.columns);
  const deferredRows = React.useDeferredValue(props.rows);
  const isStale = false;
  // deferredColumns !== props.columns || deferredRows !== props.rows;
  return (
    <Box
      sx={{
        ...sx,
        filter: isStale ? "grayscale(1) brightness(75%)" : undefined,
      }}
    >
      <MemoDataGrid {...props} columns={deferredColumns} rows={deferredRows} />
    </Box>
  );
};

const MemoDataGrid = React.memo(DataGrid);

export default ObservableDataGrid;
