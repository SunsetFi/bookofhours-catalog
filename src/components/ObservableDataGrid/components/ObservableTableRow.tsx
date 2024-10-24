import React from "react";

import { Row } from "@tanstack/react-table";

import { TableRow } from "@mui/material";

import ObservableTableCell from "./ObservableTableCell";

const ObservableTableRow = ({ row }: { row: Row<Record<string, any>> }) => {
  return (
    <TableRow>
      {row.getVisibleCells().map((cell) => (
        <ObservableTableCell key={cell.id} cell={cell} />
      ))}
    </TableRow>
  );
};

export default ObservableTableRow;
