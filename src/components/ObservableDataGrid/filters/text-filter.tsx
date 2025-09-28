import React from "react";

import { Box, TextField, Button, IconButton } from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";

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
    [onChange],
  );

  const [localValue, setLocalValue] = useDebounceCommitValue(onCommit);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <TextField
        sx={{ m: 1 }}
        autoFocus
        label="Search"
        slotProps={{
          input: {
            autoFocus: true,
            endAdornment: (
              <IconButton onClick={() => onChange(null)} size="small">
                <CloseIcon fontSize="small" />
              </IconButton>
            ),
          },
        }}
        value={localValue ?? filterValue ?? ""}
        onChange={(e) => setLocalValue(e.target.value)}
      />
    </Box>
  );
};
