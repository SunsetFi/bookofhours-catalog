import * as React from "react";

import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";

import { FilterComponentProps, FilterDef } from "../types";

export function textFilter(): FilterDef<string, string> {
  return {
    FilterComponent: TextSearchFilter,
    filterValue(value, filter) {
      if (filter == "") {
        return true;
      }

      return (value ?? "").toLowerCase().includes(filter.toLowerCase());
    },
    defaultFilterValue: "",
  };
}

const TextSearchFilter = ({
  value,
  onChange,
}: FilterComponentProps<string>) => {
  return (
    <Box sx={{ p: 1, display: "flex", flexDirection: "column", width: "100%" }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          width: "100%",
        }}
      >
        <Button size="small" onClick={() => onChange("")}>
          Clear
        </Button>
      </Box>
      <TextField
        sx={{ m: 1 }}
        autoFocus
        label="Search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </Box>
  );
};
