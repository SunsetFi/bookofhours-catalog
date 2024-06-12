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
  const requirements = useObservation(orchestration.requirements$) ?? {};
  const slots =
    useObservation(observableObjectOrEmpty(orchestration.slots$)) ?? {};

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        rowGap: 2,
        columnGap: 3,
        overflow: "auto",
        ...sx,
      }}
    >
      {Object.keys(slots).map((slotId) => (
        <OrchestrationSlotEditor
          key={slotId}
          slot={slots[slotId]}
          recipeRequiredAspects={Object.keys(requirements)}
        />
      ))}
    </Box>
  );
};

export default OrchestrationSlots;