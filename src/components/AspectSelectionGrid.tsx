import * as React from "react";

import Box from "@mui/material/Box";
import type { SxProps } from "@mui/material";

import AspectIcon from "./AspectIcon";

export interface AspectSelectionGridProps {
  sx?: SxProps;
  items: readonly string[];
  value: string[];
  onChange(value: string[]): void;
}

const AspectSelectionGrid = ({
  sx,
  items,
  value,
  onChange,
}: AspectSelectionGridProps) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap",
        maxWidth: 250,
        gap: 2,
        ...sx,
      }}
    >
      {items.map((aspectId) => (
        <AspectIcon
          key={aspectId}
          aspectId={aspectId}
          size={40}
          sx={{
            filter: value.includes(aspectId) ? undefined : "grayscale(1)",
          }}
          onClick={() => {
            if (value.includes(aspectId)) {
              onChange(value.filter((a) => a !== aspectId));
            } else {
              onChange([...value, aspectId]);
            }
          }}
        />
      ))}
    </Box>
  );
};

export default AspectSelectionGrid;
