import * as React from "react";

import Box from "@mui/material/Box";

import CraftIconButton from "@/components/CraftIconButton";
import { ObservableDataGridColumnDef } from "@/components/ObservableDataGrid";

import { CraftableModel } from "../crafting-data-source";
import PinRecipeIconButton from "@/components/PinRecipeIconButton";

export function craftableCommandsColumn(): ObservableDataGridColumnDef<CraftableModel> {
  return {
    headerName: "",
    width: 50,
    field: "$item",
    renderCell: ({ value }) => (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <PinRecipeIconButton recipeId={value.id} />
        <CraftIconButton onClick={() => value.craft()} />
      </Box>
    ),
  };
}
