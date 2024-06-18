import React from "react";

import { Box, TextField, Button } from "@mui/material";

import { useDebounceCommitValue } from "@/hooks/use-debounce-value";

import { FilterComponentProps } from "./types";

export const TextFilter = ({
  filterValue,
  onChange,
}: FilterComponentProps<string | null, string | null>) => {
  const onCommit = React.useCallback(
    (value: string) => {
      if (value === "") {
        onChange(null);
      } else {
        onChange(value);
      }
    },
    [onChange]
  );

  const [localValue, setLocalValue] = useDebounceCommitValue(700, onCommit);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <Box
        sx={{
          pt: 1,
          px: 1,
          display: "flex",
          flexDirection: "row",
          width: "100%",
        }}
      >
        <Button size="small" onClick={() => onChange(null)}>
          Clear
        </Button>
      </Box>
      <TextField
        sx={{ m: 1 }}
        autoFocus
        label="Search"
        InputProps={{ autoFocus: true }}
        value={localValue ?? filterValue ?? ""}
        onChange={(e) => setLocalValue(e.target.value)}
      />
    </Box>
  );
};
