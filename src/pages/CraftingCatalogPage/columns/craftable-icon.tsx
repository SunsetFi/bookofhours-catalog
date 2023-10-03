import * as React from "react";

import Box from "@mui/material/Box";

import { ObservableDataGridColumnDef } from "@/components/ObservableDataGrid";

import { CraftableModel } from "../crafting-data-source";

export function craftableIconColumn(): ObservableDataGridColumnDef<CraftableModel> {
  return {
    headerName: "",
    width: 90,
    observable: "iconUrl$",
    renderCell: ({ value }) => (
      <Box
        sx={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
        }}
      >
        <img
          loading="lazy"
          src={value}
          style={{ maxWidth: "75px", maxHeight: "75px" }}
        />
      </Box>
    ),
  };
}
