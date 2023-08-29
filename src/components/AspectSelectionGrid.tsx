import * as React from "react";

import Box from "@mui/material/Box";
import type { SxProps } from "@mui/material";

import { useAspects } from "@/services/sh-model/hooks";

export interface AspectSelectionGridProps {
  sx?: SxProps;
  availableAspectIds?: readonly string[];
  value: string[];
  onChange(value: string[]): void;
}

const AspectSelectionGrid = ({
  sx,
  availableAspectIds,
  value,
  onChange,
}: AspectSelectionGridProps) => {
  const aspects = useAspects();
  const availableAspects = availableAspectIds
    ? aspects.filter((a) => availableAspectIds.includes(a.id))
    : aspects;

  console.log("value", value);
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
      {availableAspects.map((aspect) => (
        <Box
          key={aspect.id}
          sx={{
            cursor: "pointer",
            filter: value.includes(aspect.id) ? undefined : "grayscale(1)",
          }}
          onClick={() => {
            if (value.includes(aspect.id)) {
              onChange(value.filter((a) => a !== aspect.id));
            } else {
              onChange([...value, aspect.id]);
            }
          }}
        >
          <img src={aspect.iconUrl} alt={aspect.label} width={40} height={40} />
        </Box>
      ))}
    </Box>
  );
};

export default AspectSelectionGrid;
