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
import type {
  GridColDef,
  GridColumnHeaderParams,
} from "@mui/x-data-grid/models";

import { observeAll, useObservation } from "@/observables";

import { ElementStackModel } from "@/services/sh-monitor";

import { renderCellTextWrap } from "./cells/text-wrap";

import { ElementDataGridColumnDef } from "./types";

export interface ElementDataGridProps {
  sx?: SxProps;
  columns: ElementDataGridColumnDef[];
  elements$: Observable<readonly ElementStackModel[]>;
}

const pageSizeOptions = [10, 25, 50];

// We need to tunnel filter values into the headers, and invalidating all col defs takes a heavy toll.  Use context instead
const FilterContext = React.createContext<
  [
    Record<string, any>,
    React.Dispatch<React.SetStateAction<Record<string, any>>>
  ]
>([{}, () => {}]);

const ElementDataGrid = ({ sx, columns, elements$ }: ElementDataGridProps) => {
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
      column: ElementDataGridColumnDef,
      index: number
    ): GridColDef {
      const { field, observable, filter, ...colDef } = column;
      const Header = ({ colDef }: GridColumnHeaderParams) => {
        const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(
          null
        );
        const FilterComponent = filter?.FilterComponent;
        const [filterValue, setFilterValue] = React.useContext(FilterContext);
        return (
          <Box
            sx={{ display: "flex", flexDirection: "row", alignItems: "center" }}
          >
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
                      isEqual(
                        filterValue[colDef.field],
                        filter.defaultFilterValue
                      )
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

      return {
        renderCell: column.wrap ? renderCellTextWrap : undefined,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        ...colDef,
        field: `column_${index}`,
        renderHeader: Header,
      };
    }

    return columns.map(getColDef);
  }, [columns]);

  const rows =
    useObservation(
      () =>
        elements$.pipe(
          map((elements) =>
            elements.map((element) => {
              const observables = columns.map((column) => {
                if (column.field) {
                  return observableOf(element[column.field]);
                } else if (typeof column.observable === "string") {
                  return element[column.observable];
                } else if (typeof column.observable === "function") {
                  return column.observable(element);
                } else {
                  return observableOf(undefined);
                }
              });

              return combineLatest(observables).pipe(
                map((values) => {
                  const value: any = {
                    id: element.id,
                  };
                  values.forEach((v, i) => {
                    value[`column_${i}`] = v;
                  });
                  return value;
                })
              );
            })
          ),
          observeAll()
        ),
      [elements$, columns]
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
  );
};

export default ElementDataGrid;
