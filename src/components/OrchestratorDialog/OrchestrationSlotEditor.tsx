import React from "react";
import { Box, Typography } from "@mui/material";

import { useObservation } from "@/hooks/use-observation";

import { OrchestrationSlot } from "@/services/sh-game";

import ElementStackSelectField from "../ElementStackSelectField";
import AspectIcon from "../AspectIcon";

interface OrchestrationSlotEditorProps {
  slot: OrchestrationSlot;
  recipeRequiredAspects: readonly string[];
}

const OrchestrationSlotEditor = ({
  slot,
  recipeRequiredAspects,
}: OrchestrationSlotEditorProps) => {
  const assignment = useObservation(slot.assignment$) ?? null;

  // Remove the power aspects from these since that will be displayed by the workstation hints.
  const requiredAspects = Object.keys(slot.spec.required);
  const essentialAspects = Object.keys(slot.spec.essential);

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", gap: 1, width: "100%" }}
    >
      <Box
        sx={{ display: "flex", flexDirection: "row", gap: 1, width: "100%" }}
      >
        <Typography variant="body1" sx={{ mr: "auto" }}>
          {slot.spec.label}
        </Typography>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            gap: 1,
            // FIXME: We are getting an aspect that is hidden here... See skill upgrade recipes on consider slot.
            mr: essentialAspects.length > 0 ? 2 : 0,
          }}
        >
          {requiredAspects.map((aspectId) => (
            <AspectIcon key={aspectId} aspectId={aspectId} size={30} />
          ))}
        </Box>
        <Box sx={{ display: "flex", flexDirection: "row", gap: 1 }}>
          {essentialAspects.map((aspectId) => (
            <AspectIcon key={aspectId} aspectId={aspectId} size={30} />
          ))}
        </Box>
      </Box>
      <ElementStackSelectField
        label="Element"
        fullWidth
        readOnly={slot.locked}
        elementStacks$={slot.availableElementStacks$}
        requireExterior
        displayAspects={recipeRequiredAspects}
        value={assignment}
        onChange={(stack) => slot.assign(stack)}
      />
    </Box>
  );
};

export default OrchestrationSlotEditor;
