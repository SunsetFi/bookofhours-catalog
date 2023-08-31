import * as React from "react";
import { isEqual } from "lodash";
import { Observable, combineLatest, map, of as observableOf } from "rxjs";

import type { SxProps } from "@mui/material";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Popover from "@mui/material/Popover";

import FilterAlt from "@mui/icons-material/FilterAlt";

import { DataGrid } from "@mui/x-data-grid/DataGrid";
import type { GridColDef } from "@mui/x-data-grid/models";

import { observeAll, useObservation } from "@/observables";

import { renderCellTextWrap } from "./cells/text-wrap";

import { ObservableDataGridColumnDef, FilterDef } from "./types";

export interface ObservableDataGridProps<T> {
  sx?: SxProps;
  columns: ObservableDataGridColumnDef<T>[];
  items$: Observable<readonly T[]>;
}

const pageSizeOptions = [10, 25, 50];

// We need to tunnel filter values into the headers, and invalidating all col defs takes a heavy toll.  Use context instead
const FilterContext = React.createContext<
  [
    Record<string, any>,
    React.Dispatch<React.SetStateAction<Record<string, any>>>
  ]
>([{}, () => {}]);

interface ElementColumnHeaderProps {
  filter: FilterDef | undefined;
  colDef: GridColDef;
}

const ElementColumnHeader = ({ colDef, filter }: ElementColumnHeaderProps) => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const FilterComponent = filter?.FilterComponent;
  const [filterValue, setFilterValue] = React.useContext(FilterContext);
  return (
    <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
      <Typography variant="body2">{colDef.headerName}</Typography>
      {FilterComponent && (
        <>
          <IconButton
            size="small"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setAnchorEl(e.currentTarget);
            }}
          >
            <FilterAlt
              opacity={
                isEqual(filterValue[colDef.field], filter.defaultFilterValue)
                  ? 0.5
                  : 1
              }
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
              value={filterValue[colDef.field]}
              onChange={(newValue: any) => {
                setFilterValue((prevFilters) => ({
                  ...prevFilters,
                  [colDef.field]: newValue,
                }));
              }}
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
  const observables = columns.map((column) => {
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

  // This claims it is deprecacted.  It lies.  We are passing an array, but typescript gets fooled into thinking
  // we are passing an arbitrary number of arguments.
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
  const filterStatePair = React.useState<Record<string, any>>(defaultFilters);
  const filterValue = filterStatePair[0];

  const colDefs = React.useMemo(() => {
    function getColDef(
      column: ObservableDataGridColumnDef<T>,
      index: number
    ): GridColDef {
      const { field, observable, filter, ...colDef } = column;
      return {
        renderCell: column.wrap ? renderCellTextWrap : undefined,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        ...colDef,
        field: `column_${index}`,
        renderHeader: ({ colDef }) => (
          <ElementColumnHeader filter={filter} colDef={colDef} />
        ),
      };
    }

    return columns.map(getColDef);
  }, [columns]);

  const rows =
    useObservation(
      () =>
        items$.pipe(
          map((elements) =>
            elements.map((element) => itemToRow(element, columns))
          ),
          observeAll()
        ),
      [items$, columns]
    ) ?? [];

  const filteredRows = rows.filter((element) => {
    for (let i = 0; i < columns.length; i++) {
      const { filter } = columns[i];
      if (!filter) {
        continue;
      }

      if (
        !filter.filterValue(element[`column_${i}`], filterValue[`column_${i}`])
      ) {
        return false;
      }
    }

    return true;
  });

  return (
    // Stupid box because stupid datagrid expands bigger than its 100% size.
    <Box sx={{ overflow: "hidden" }}>
      <FilterContext.Provider value={filterStatePair}>
        <DataGrid
          sx={sx}
          columns={colDefs}
          rows={filteredRows}
          rowHeight={100}
          density="comfortable"
          initialState={{
            pagination: { paginationModel: { pageSize: pageSizeOptions[2] } },
          }}
          pageSizeOptions={pageSizeOptions}
          // Virtualization is causing scrolling to be all kinds of jank.
          disableVirtualization
        />
      </FilterContext.Provider>
    </Box>
  );
}

export default ObservableDataGrid;
