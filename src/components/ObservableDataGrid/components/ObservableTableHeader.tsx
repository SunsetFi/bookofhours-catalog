import React from "react";

import { TableHead, TableRow } from "@mui/material";

import { HeaderGroup } from "@tanstack/react-table";
import HeaderCell from "./HeaderCell";

const ObservableTableHeader = React.memo(
  ({ headerGroups }: { headerGroups: HeaderGroup<Record<string, any>>[] }) => {
    return (
      <TableHead>
        {headerGroups.map((group) => (
          <TableRow key={group.id}>
            {group.headers.map((header) => (
              <HeaderCell key={header.id} header={header} />
            ))}
          </TableRow>
        ))}
      </TableHead>
    );
  },
);

export default ObservableTableHeader;
