import React from "react";
import { Stack, Typography } from "@mui/material";

import { useObservation } from "@/hooks/use-observation";

import { OrchestrationSlot } from "@/services/sh-game";

import ElementStackSelectField from "../Elements/ElementStackSelectField";
import AspectIcon from "../Aspects/AspectIcon";

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
    <Stack direction="column" gap={1} sx={{ width: "100%" }}>
      <Stack direction="row" gap={1} sx={{ width: "100%" }}>
        <Typography variant="body1" sx={{ mr: "auto" }}>
          {slot.spec.label}
        </Typography>
        <Stack
          direction="row"
          gap={1}
          sx={{
            // FIXME: We are getting an aspect that is hidden here... See skill upgrade recipes on consider slot.
            mr: essentialAspects.length > 0 ? 2 : 0,
          }}
        >
          {requiredAspects.map((aspectId) => (
            <AspectIcon key={aspectId} aspectId={aspectId} size={30} />
          ))}
        </Stack>
        <Stack direction="row" gap={1}>
          {essentialAspects.map((aspectId) => (
            <AspectIcon key={aspectId} aspectId={aspectId} size={30} />
          ))}
        </Stack>
      </Stack>
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
    </Stack>
  );
};

export default OrchestrationSlotEditor;
