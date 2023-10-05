import * as React from "react";

import { isEqual } from "lodash";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Popover from "@mui/material/Popover";
import type { GridColDef } from "@mui/x-data-grid";

import FilterAlt from "@mui/icons-material/FilterAlt";

import { FilterDef } from "../types";
import { useFilterValue, useSetFilterValue } from "../context";

interface ColumnHeaderProps {
  filter: FilterDef | undefined;
  columnValues: any[];
  colDef: GridColDef;
}

const ColumnHeader = ({ colDef, filter, columnValues }: ColumnHeaderProps) => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const FilterComponent = filter?.FilterComponent;

  // Im not sure about the safty of using props for this selector, and its not documented.
  const value = useFilterValue(filter?.key ?? null);

  const onOpen = React.useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  }, []);

  const onFilterChange = useSetFilterValue(filter?.key ?? null);

  return (
    <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
      <Typography variant="body1">{colDef.headerName}</Typography>
      {FilterComponent && (
        <>
          <IconButton
            size="small"
            onClick={onOpen}
            aria-label={`Filter ${colDef.headerName}`}
          >
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

export default ColumnHeader;
