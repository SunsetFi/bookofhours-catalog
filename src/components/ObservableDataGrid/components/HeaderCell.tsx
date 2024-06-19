import React from "react";

import { Header, flexRender } from "@tanstack/react-table";

import { Box, TableCell, Typography } from "@mui/material";

import HeaderFilter from "./HeaderFilter";
import HeaderSort from "./HeaderSort";

const HeaderCell = ({
  header,
}: {
  header: Header<Record<string, any>, unknown>;
}) => {
  return (
    <TableCell
      scope="col"
      colSpan={header.colSpan}
      tabIndex={0}
      // TODO: Figure out flex.  It was supported at one point but seems to have been lost with v8.
      sx={{
        width:
          header.getSize() === Number.MAX_SAFE_INTEGER
            ? "100%"
            : header.getSize(),
      }}
    >
      <Box component="span" sx={{ display: "flex", alignItems: "center" }}>
        <Typography sx={{ mr: 1 }}>
          {!header.isPlaceholder &&
            flexRender(header.column.columnDef.header, header.getContext())}
        </Typography>
        {header.column.getCanFilter() && (
          <HeaderFilter column={header.column} />
        )}
        {header.column.getCanSort() && <HeaderSort header={header} />}
      </Box>
    </TableCell>
  );
};

export default HeaderCell;
