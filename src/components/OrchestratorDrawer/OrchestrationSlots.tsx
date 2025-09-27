import React from "react";

import { Box, SxProps } from "@mui/material";

import { useObservation } from "@/hooks/use-observation";

import { ThresholdedOrchestration } from "@/services/sh-game";

import OrchestrationSlotEditor from "./OrchestrationSlotEditor";

interface OrchestrationSlotsProps {
  sx?: SxProps;
  orchestration: ThresholdedOrchestration;
  autoFocus?: boolean;
}

const OrchestrationSlots = ({
  sx,
  orchestration,
  autoFocus,
}: OrchestrationSlotsProps) => {
  const slots = useObservation(orchestration.slots$) ?? [];

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gridTemplateRows: `repeat(${Math.ceil(
          slots.length / 2,
        )}, fit-content(100px))`,
        rowGap: 5,
        columnGap: 3,
        overflow: "auto",
        ...sx,
      }}
    >
      {slots.map((slot, i) => (
        <OrchestrationSlotEditor
          key={slot.spec.id}
          slot={slot}
          orchestration={orchestration}
          autoFocus={autoFocus && i === 0}
        />
      ))}
    </Box>
  );
};

export default OrchestrationSlots;
