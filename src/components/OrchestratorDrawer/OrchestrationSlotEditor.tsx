import React from "react";
import { Box, Stack, Typography } from "@mui/material";
import { pick } from "lodash";
import { switchMap } from "rxjs";

import { Null$ } from "@/observables";

import { useObservation } from "@/hooks/use-observation";

import { Orchestration, OrchestrationSlot } from "@/services/sh-game";

import ElementStackSelectField from "../Elements/ElementStackSelectField";
import AspectIcon from "../Aspects/AspectIcon";
import AspectsList from "../Aspects/AspectsList";
import ScreenReaderContent from "../ScreenReaderContent";

interface OrchestrationSlotEditorProps {
  slot: OrchestrationSlot;
  orchestration: Orchestration;
  autoFocus?: boolean;
}

const OrchestrationSlotEditor = React.memo(
  ({ slot, orchestration, autoFocus }: OrchestrationSlotEditorProps) => {
    const id = React.useId();

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
      <ElementStackSelectField
        sx={{ mt: 1 }}
        fullWidth
        label={slot.spec.label}
        helperText={
          <Stack direction="column" gap={1} sx={{ mt: 0.5 }}>
            {requiredAspects.length > 0 && (
              <Stack direction="row" gap={1}>
                <Typography component="span" sx={{ mr: "auto" }}>
                  Requires
                </Typography>
                {requiredAspects.map((aspectId) => (
                  <AspectIcon key={aspectId} aspectId={aspectId} size={30} />
                ))}
              </Stack>
            )}
            {essentialAspects.length > 0 && (
              <Stack direction="row" gap={1}>
                <Typography component="span" sx={{ mr: "auto" }}>
                  Essential
                </Typography>
                {essentialAspects.map((aspectId) => (
                  <AspectIcon key={aspectId} aspectId={aspectId} size={30} />
                ))}
              </Stack>
            )}
            {Object.keys(slotContributingAspects).length > 0 && (
              <Stack direction="row" gap={1}>
                <Typography component="span" sx={{ mr: "auto" }}>
                  Contributes
                </Typography>
                <AspectsList
                  sx={{ justifyContent: "flex-end" }}
                  aspects={slotContributingAspects}
                  iconSize={30}
                />
              </Stack>
            )}
          </Stack>
        }
        readOnly={slot.locked}
        elementStacks$={slot.availableElementStacks$}
        requireExterior
        displayAspects={recipeRequiredAspects}
        value={assignment}
        onChange={(stack) => slot.assign(stack)}
        autoFocus={autoFocus}
      />
    );
  }
);

export default OrchestrationSlotEditor;
