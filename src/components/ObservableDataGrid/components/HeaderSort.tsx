import React from "react";

import { Header } from "@tanstack/react-table";

import { IconButton } from "@mui/material";
import { ArrowUpward, ArrowDownward } from "@mui/icons-material";

const HeaderSort = ({
  header,
}: {
  header: Header<Record<string, any>, unknown>;
}) => {
  const isSorted = header.column.getIsSorted();
  let sortModeDescription: string;
  if (isSorted == false) {
    sortModeDescription = "inactive";
  } else if (isSorted === "asc") {
    sortModeDescription = "ascending";
  } else {
    sortModeDescription = "descending";
  }

  return (
    <IconButton
      size="small"
      aria-label={`Sort ${sortModeDescription}`}
      sx={{
        opacity: isSorted === false ? 0.4 : 1,
      }}
      onClick={header.column.getToggleSortingHandler()}
    >
      {isSorted === false || isSorted === "asc" ? (
        <ArrowUpward />
      ) : (
        <ArrowDownward />
      )}
    </IconButton>
  );
};

export default HeaderSort;
