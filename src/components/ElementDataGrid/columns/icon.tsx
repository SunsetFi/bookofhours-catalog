import * as React from "react";

import Box from "@mui/material/Box";

import { ElementDataGridColumnDef } from "../types";

export function iconColumnDef(
  additional: Partial<
    Omit<ElementDataGridColumnDef, "field" | "observable">
  > = {}
): ElementDataGridColumnDef {
  return {
    headerName: "",
    width: 90,
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
        <img src={value} style={{ maxWidth: "75px", maxHeight: "75px" }} />
      </Box>
    ),
    ...additional,
    field: "iconUrl",
  };
}
