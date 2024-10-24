import React from "react";

import { Cell, flexRender } from "@tanstack/react-table";

import { TableCell } from "@mui/material";

import { isRowHeaderColumn } from "../types";

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

export default ObservableTableCell;
