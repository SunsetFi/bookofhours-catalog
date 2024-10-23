import React from "react";

import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SxProps,
} from "@mui/material";

export type MultiValueFilterMode = "all" | "any" | "none";
export interface MultiValueFilterHeaderProps {
  sx?: SxProps;
  mode: MultiValueFilterMode;
  allowAll?: boolean;
  itemsSelected: boolean;
  onModeChange(mode: MultiValueFilterMode): void;
  onSelectAll(): void;
  onClear(): void;
}

const MultiValueFilterHeader: React.FC<MultiValueFilterHeaderProps> = ({
  sx,
  mode,
  allowAll,
  itemsSelected,
  onModeChange,
  onSelectAll,
  onClear,
}) => {
  const id = React.useId();
  return (
    <Box display="flex" flexDirection="row" sx={sx}>
      {itemsSelected ? (
        <Button onClick={onClear}>Clear</Button>
      ) : (
        <Button onClick={onSelectAll}>Select All</Button>
      )}
      <FormControl variant="standard" sx={{ ml: "auto", width: "125px" }}>
        <InputLabel id={id}>Filter Mode</InputLabel>
        <Select
          label="Filter Mode"
          labelId={id}
          value={mode}
          onChange={(e) => onModeChange(e.target.value as MultiValueFilterMode)}
        >
          <MenuItem value="any">Any</MenuItem>
          {allowAll && <MenuItem value="all">All</MenuItem>}
          <MenuItem value="none">None</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
};

export default MultiValueFilterHeader;
