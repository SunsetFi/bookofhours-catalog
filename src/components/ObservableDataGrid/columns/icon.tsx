import * as React from "react";

import Box from "@mui/material/Box";

import { ModelWithIconUrl } from "@/services/sh-game";

import { ObservableDataGridColumnDef } from "../types";

// TODO: Make observable, icons can change with the element id.
export function iconColumnDef<T extends ModelWithIconUrl>(
  additional: Partial<
    Omit<ObservableDataGridColumnDef<T>, "field" | "observable">
  > = {}
): ObservableDataGridColumnDef<T> {
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
        <img
          loading="lazy"
          src={value}
          style={{ maxWidth: "75px", maxHeight: "75px" }}
        />
      </Box>
    ),
    ...additional,
    // FIXME: string keys havent been working for a lot of these
    // observable: "iconUrl$",
    observable: (item) => item.iconUrl$,
  };
}
