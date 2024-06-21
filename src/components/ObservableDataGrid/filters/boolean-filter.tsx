import React from "react";

import { Checkbox } from "@mui/material";

import { FilterComponentProps } from "./types";

export const BooleanFilter = ({
  filterValue,
  onChange,
}: FilterComponentProps<boolean, boolean>) => {
  const onCheckChange = React.useCallback(() => {
    if (filterValue === null) {
      onChange(true);
    } else if (filterValue) {
      onChange(false);
    } else if (filterValue === false) {
      onChange(null);
    }
  }, [filterValue]);

  return (
    <Checkbox
      indeterminate={filterValue === null}
      value={filterValue ?? false}
      onChange={onCheckChange}
    />
  );
};
