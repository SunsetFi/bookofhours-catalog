import React from "react";

import {
  Box,
  Button,
  ButtonGroup,
  Divider,
  Stack,
  Typography,
} from "@mui/material";

import { mapValues } from "lodash";

import { useObservation } from "@/hooks/use-observation";

import {
  PendingOrchestration,
  isVariableSituationOrchestration,
} from "@/services/sh-game";

import GameTypography from "../GameTypography";
import SituationSelectField from "../SituationSelectField";

import AspectsList from "../Aspects/AspectsList";

import OrchestrationContentHeader from "./OrchestratonContentHeader";

import OrchestrationSlots from "./OrchestrationSlots";
import RequireInteractivity from "../RequireInteractivity";

export interface PendingOrchestrationContentProps {
  onBack(): void;
  orchestration: PendingOrchestration;
}

const PendingOrchestrationContent = ({
  orchestration,
  onBack,
}: PendingOrchestrationContentProps) => {
  const label = useObservation(orchestration.label$);
  const description = useObservation(orchestration.description$);

  const situation = useObservation(orchestration.situation$);

  const requirements = useObservation(orchestration.requirements$) ?? {};
  const aspects = useObservation(orchestration.aspects$) ?? {};

  const canAutofill =
    useObservation(() => orchestration.canAutofill$, [orchestration]) ?? false;

  const canExecute =
    useObservation(() => orchestration.canExecute$, [orchestration]) ?? false;

  const stackItems: React.ReactNode[] = [];

  if (description) {
    stackItems.push(
      <Box sx={{ minHeight: 100, flexShrink: 0 }}>
        <GameTypography variant="body1" aria-live="assertive">
          {description}
        </GameTypography>
      </Box>
    );
  }

  if (isVariableSituationOrchestration(orchestration)) {
    stackItems.push(
      <SituationSelectField
        label="Workstation"
        fullWidth
        requireUnstarted
        situations$={orchestration.availableSituations$}
        value={situation ?? null}
        onChange={(s) => orchestration.selectSituation(s)}
      />
    );
  }

  if (Object.keys(requirements).length > 0) {
    stackItems.push(
      <AspectsList
        sx={{ justifyContent: "center", height: 30 }}
        aspects={mapValues(
          requirements,
          (value, key) => `${aspects[key] ?? 0} / ${value}`
        )}
        iconSize={30}
      />
    );
  } else {
    stackItems.push(
      <Typography sx={{ height: 30, textAlign: "center" }}>
        Slot enough cards for a recipe to see its requirements.
      </Typography>
    );
  }

  stackItems.push(
    <OrchestrationSlots sx={{ height: "100%" }} orchestration={orchestration} />
  );

  stackItems.push(
    <Stack direction="row" sx={{ mt: "auto" }}>
      <ButtonGroup sx={{ ml: "auto" }}>
        <RequireInteractivity interactivity="full" compare="greater">
          {canAutofill && (
            <Button
              disabled={!canAutofill}
              onClick={() => orchestration.autofill()}
            >
              Autofill
            </Button>
          )}
        </RequireInteractivity>
        <Button disabled={!canExecute} onClick={() => orchestration.execute()}>
          Start Recipe
        </Button>
      </ButtonGroup>
    </Stack>
  );

  return (
    <Stack direction="column" sx={{ height: "100%" }} aria-live="assertive">
      <OrchestrationContentHeader
        title={label ?? "Orchestration"}
        onBack={onBack}
      />
      <Stack direction="column" spacing={2} sx={{ height: "100%", p: 2 }}>
        {stackItems.map((item, index) => (
          <React.Fragment key={index}>
            {index !== 0 && <Divider aria-hidden="true" />}
            {item}
          </React.Fragment>
        ))}
      </Stack>
    </Stack>
  );
};

export default PendingOrchestrationContent;
