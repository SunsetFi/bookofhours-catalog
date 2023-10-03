import * as React from "react";

import Box from "@mui/material/Box";

import { ObservableDataGridColumnDef } from "@/components/ObservableDataGrid";
import FocusIconButton from "@/components/FocusIconButton";
import CraftIconButton from "@/components/CraftIconButton";

import { BookModel } from "../BookDataSource";

export function bookCommandsColumn(): ObservableDataGridColumnDef<BookModel> {
  return {
    headerName: "",
    width: 50,
    field: "$item",
    renderCell: ({ value }) => {
      return (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <FocusIconButton token={value} />
          <CraftIconButton onClick={() => value.read()} />
        </Box>
      );
    },
  };
}
