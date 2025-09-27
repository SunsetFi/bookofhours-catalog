import React from "react";

import { Column } from "@tanstack/react-table";

import { IconButton, Popover } from "@mui/material";
import { FilterAlt } from "@mui/icons-material";

const HeaderFilter = ({ column }: { column: Column<any, unknown> }) => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const [open, setOpen] = React.useState(false);

  const onOpen = React.useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
  }, []);

  const filterActive =
    column.getIsFiltered() && column.getFilterValue() != null;

  const Filter = column.columnDef.meta?.filterComponent;

  if (!Filter) {
    console.warn(
      "Not rendering header filter for",
      column.id,
      "with def",
      column.columnDef,
      "as filter component is null.",
    );
    return null;
  }

  const uniqueValues =
    anchorEl != null ? Array.from(column.getFacetedUniqueValues().keys()) : [];

  return (
    <>
      <IconButton
        ref={setAnchorEl}
        size="small"
        aria-label={`Filter ${filterActive ? "active" : "inactive"}`}
        onClick={onOpen}
      >
        <FilterAlt
          sx={{
            opacity:
              // Not sure how to reset the filter, so we just pass null for now.
              filterActive ? 1 : 0.4,
          }}
        />
      </IconButton>
      <Popover
        open={open}
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        onClose={() => {
          setOpen(false);
        }}
      >
        {open && (
          <Filter
            columnValues={uniqueValues}
            filterValue={column.getFilterValue() ?? null}
            onChange={column.setFilterValue}
          />
        )}
      </Popover>
    </>
  );
};

export default HeaderFilter;
