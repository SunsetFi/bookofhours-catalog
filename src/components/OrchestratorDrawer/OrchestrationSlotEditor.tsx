import React from "react";
import { Stack, Typography } from "@mui/material";
import { pick } from "lodash";
import { switchMap } from "rxjs";

import { Null$ } from "@/observables";

import { useObservation } from "@/hooks/use-observation";

import { Orchestration, OrchestrationSlot } from "@/services/sh-game";

import ElementStackSelectField from "../Elements/ElementStackSelectField";
import AspectIcon from "../Aspects/AspectIcon";
import AspectsList from "../Aspects/AspectsList";

interface OrchestrationSlotEditorProps {
  slot: OrchestrationSlot;
  orchestration: Orchestration;
  autoFocus?: boolean;
}

const OrchestrationSlotEditor = React.memo(
  ({ slot, orchestration, autoFocus }: OrchestrationSlotEditorProps) => {
    const assignment = useObservation(slot.assignment$) ?? null;
    const assignmentAspects =
      useObservation(
        () =>
          slot.assignment$.pipe(switchMap((stack) => stack?.aspects$ ?? Null$)),
        [slot]
      ) ?? {};

    const recipeRequirements =
      useObservation(orchestration.requirements$) ?? null;
    const recipeRequiredAspects = React.useMemo(
      () => Object.keys(recipeRequirements ?? {}),
      [recipeRequirements]
    );

    const slotContributingAspects = React.useMemo(
      () => pick(assignmentAspects, recipeRequiredAspects),
      [recipeRequiredAspects]
    );

    // Remove the power aspects from these since that will be displayed by the workstation hints.
    const requiredAspects = Object.keys(slot.spec.required);
    const essentialAspects = Object.keys(slot.spec.essential);

    return (
      <Stack direction="column" gap={1} sx={{ width: "100%" }}>
        <Stack direction="row" gap={1} sx={{ width: "100%" }} flexWrap="wrap">
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
          sx={{ mt: 1 }}
          label="Element"
          fullWidth
          readOnly={slot.locked}
          elementStacks$={slot.availableElementStacks$}
          requireExterior
          displayAspects={recipeRequiredAspects}
          value={assignment}
          onChange={(stack) => slot.assign(stack)}
          autoFocus={autoFocus}
        />
        <AspectsList
          sx={{ justifyContent: "flex-end", height: 30 }}
          aspects={slotContributingAspects}
          iconSize={30}
        />
      </Stack>
    );
  }
);

export default OrchestrationSlotEditor;
