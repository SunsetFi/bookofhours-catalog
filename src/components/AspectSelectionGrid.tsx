import * as React from "react";

import Box from "@mui/material/Box";
import type { SxProps } from "@mui/material";

import AspectIcon from "./AspectIcon";

export interface AspectSelectionGridProps {
  sx?: SxProps;
  items: readonly string[];
  value: readonly string[];
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
          role="button"
          aria-pressed={value.includes(aspectId) ? "true" : "false"}
          tabIndex={0}
          key={aspectId}
          aspectId={aspectId}
          size={40}
          sx={{
            filter: value.includes(aspectId)
              ? undefined
              : "brightness(45%) grayscale(0.5)",
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
