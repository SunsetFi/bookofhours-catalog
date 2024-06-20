import React from "react";

import { Box, SxProps } from "@mui/material";

import { observableObjectOrEmpty } from "@/observables";

import { useObservation } from "@/hooks/use-observation";

import { Orchestration } from "@/services/sh-game";

import OrchestrationSlotEditor from "./OrchestrationSlotEditor";

interface OrchestrationSlotsProps {
  sx?: SxProps;
  orchestration: Orchestration;
}

const OrchestrationSlots = ({ sx, orchestration }: OrchestrationSlotsProps) => {
  const slots =
    useObservation(observableObjectOrEmpty(orchestration.slots$)) ?? {};
  const slotKeys = Object.keys(slots);

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gridTemplateRows: `repeat(${Math.ceil(
          slotKeys.length / 2
        )}, fit-content(100px))`,
        rowGap: 5,
        columnGap: 3,
        overflow: "auto",
        ...sx,
      }}
    >
      {slotKeys.map((slotId, i) => (
        <OrchestrationSlotEditor
          key={slotId}
          slot={slots[slotId]}
          orchestration={orchestration}
          autoFocus={i === 0}
        />
      ))}
    </Box>
  );
};

export default OrchestrationSlots;
