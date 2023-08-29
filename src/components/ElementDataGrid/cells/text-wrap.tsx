import * as React from "react";

import type { GridRenderCellParams } from "@mui/x-data-grid/models";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export function renderCellTextWrap({ value }: GridRenderCellParams) {
  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <Typography
        variant="body2"
        sx={{
          width: "100%",
          height: "100%",
          whiteSpace: "break-spaces",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}
