import * as React from "react";
import { isEqual } from "lodash";
import { Observable, combineLatest, map, of as observableOf, tap } from "rxjs";
import { createContext, useContextSelector } from "use-context-selector";

import type { SxProps } from "@mui/material";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Popover from "@mui/material/Popover";
import CircularProgress from "@mui/material/CircularProgress";

import type { DataGridProps } from "@mui/x-data-grid";

import FilterAlt from "@mui/icons-material/FilterAlt";

import { DataGrid } from "@mui/x-data-grid/DataGrid";
import type { GridColDef } from "@mui/x-data-grid/models";

import {
  mapArrayItemsCached,
  observeAll,
  profileDownstream,
  useObservation,
} from "@/observables";

import { renderCellTextWrap } from "./cells/text-wrap";

import { ObservableDataGridColumnDef, FilterDef } from "./types";

export interface ObservableDataGridProps<T> {
  sx?: SxProps;
  columns: ObservableDataGridColumnDef<T>[];
  items$: Observable<readonly T[]>;
}

const pageSizeOptions = [10, 25, 50];
const initialState = {
  pagination: { paginationModel: { pageSize: pageSizeOptions[2] } },
};

// We need to tunnel filter values into the headers, and invalidating all col defs takes a heavy toll.  Use context instead
const FilterValueContext = createContext<Record<string, any>>({});
const FilterDispatchContext = React.createContext<
  React.Dispatch<React.SetStateAction<Record<string, any>>>
>(() => {});

interface ElementColumnHeaderProps {
  filter: FilterDef | undefined;
  columnValues: any[];
  colDef: GridColDef;
}

const ElementColumnHeader = ({
  colDef,
  filter,
  columnValues,
}: ElementColumnHeaderProps) => {
  const setFilterValue = React.useContext(FilterDispatchContext);

  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const FilterComponent = filter?.FilterComponent;

  // Im not sure about the safty of using props for this selector, and its not documented.
  const value = useContextSelector(
    FilterValueContext,
    (filterValue) => filterValue[colDef.field]
  );

  const onOpen = React.useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  }, []);

  const onFilterChange = React.useCallback((newValue: any) => {
    setFilterValue((prevFilters) => ({
      ...prevFilters,
      [colDef.field]: newValue,
    }));
  }, []);

  return (
    <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
      <Typography variant="body1">{colDef.headerName}</Typography>
      {FilterComponent && (
        <>
          <IconButton size="small" onClick={onOpen}>
            <FilterAlt
              opacity={isEqual(value, filter.defaultFilterValue) ? 0.5 : 1}
            />
          </IconButton>
          <Popover
            open={anchorEl != null}
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "center",
            }}
            onClose={() => {
              setAnchorEl(null);
            }}
          >
            <FilterComponent
              columnValues={columnValues}
              value={value}
              onChange={onFilterChange}
            />
          </Popover>
        </>
      )}
    </Box>
  );
};

function itemToRow(
  item: any,
  columns: ObservableDataGridColumnDef<any>[]
): Observable<Record<string, any>> {
  const observables: Observable<any>[] = columns.map((column) => {
    if (column.field) {
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
  columns,
  items$,
}: ObservableDataGridProps<T>) {
  const defaultFilters: any = {};
  columns.forEach((column, i) => {
    if (column.filter?.defaultFilterValue != null) {
      defaultFilters[`column_${i}`] = column.filter.defaultFilterValue;
    }
  });
  const [filterValue, filterDispatch] =
    React.useState<Record<string, any>>(defaultFilters);

  const rows =
    useObservation(
      () =>
        items$.pipe(
          profileDownstream(
            "ObservableDataGrid rows itemToRow+observeAll+setState"
          ),
          mapArrayItemsCached((element) => itemToRow(element, columns)),
          profileDownstream("ObservableDataGrid rows observeAll+setState"),
          observeAll()
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
          <ElementColumnHeader
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
              filterValue[`column_${i}`]
            )
          ) {
            return false;
          }
        }

        return true;
      }),
    [columns, rows, filterValue]
  );

  return (
    // Stupid box because stupid datagrid expands bigger than its 100% size.
    <Box sx={{ overflow: "hidden", ...sx }}>
      <FilterDispatchContext.Provider value={filterDispatch}>
        <FilterValueContext.Provider value={filterValue}>
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
  const isStale =
    deferredColumns !== props.columns || deferredRows !== props.rows;
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
