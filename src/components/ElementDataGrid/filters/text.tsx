import * as React from "react";

import TextField from "@mui/material/TextField";

import { FilterComponentProps, FilterDef } from "../types";

export function textFilter(): FilterDef<string, string> {
  return {
    FilterComponent: TextSearchFilter,
    filterValue(value, filter) {
      if (filter == "") {
        return true;
      }

      return value.toLowerCase().includes(filter.toLowerCase());
    },
    defaultFilterValue: "",
  };
}

const TextSearchFilter = ({
  value,
  onChange,
}: FilterComponentProps<string>) => {
  return (
    <TextField
      sx={{ m: 1 }}
      label="Search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
};
