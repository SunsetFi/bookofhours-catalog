import React from "react";

import { Button, ButtonGroup, Divider, Stack, Typography } from "@mui/material";

import { mapValues } from "lodash";

import { EmptyArray$, Null$ } from "@/observables";

import { useObservation } from "@/hooks/use-observation";

import {
  Orchestration,
  isCompletedOrchestration,
  isContentContainingOrchestration,
  isExecutableOrchestration,
  isOngoingOrchestration,
  isThresholdedOrchestration,
  isVariableSituationOrchestration,
} from "@/services/sh-game";

import TlgNote from "../Elements/TlgNote";
import ElementStackIcon from "../Elements/ElementStackIcon";

import GameTypography from "../GameTypography";
import SituationSelectField from "../SituationSelectField";

import AspectsList from "../Aspects/AspectsList";
import ElementStackTray from "../Elements/ElementStackTray";

import OrchestrationContentHeader from "./OrchestratonContentHeader";

import OrchestrationSlots from "./OrchestrationSlots";

export interface OrchestrationContentProps {
  onBack(): void;
  orchestration: Orchestration;
}

const OrchestrationContent = ({
  orchestration,
  onBack,
}: OrchestrationContentProps) => {
  const label = useObservation(orchestration.label$);
  const description = useObservation(orchestration.description$);

  const situation = useObservation(orchestration.situation$);

  const requirements = useObservation(orchestration.requirements$) ?? {};
  const aspects = useObservation(orchestration.aspects$) ?? {};

  const hasSlots =
    (
      useObservation(
        () =>
          isThresholdedOrchestration(orchestration)
            ? orchestration.slots$
            : EmptyArray$,
        [orchestration]
      ) ?? []
    ).length > 0;

  // TODO: Show browsable notes
  const notes =
    useObservation(
      () =>
        isContentContainingOrchestration(orchestration)
          ? orchestration.notes$
          : Null$,
      [orchestration]
    ) ?? [];

  const content =
    useObservation(
      () =>
        isContentContainingOrchestration(orchestration)
          ? orchestration.content$
          : Null$,
      [orchestration]
    ) ?? [];

  const canAutofill =
    useObservation(
      () =>
        isExecutableOrchestration(orchestration) ||
        isOngoingOrchestration(orchestration)
          ? orchestration.canAutofill$
          : Null$,
      [orchestration]
    ) ?? false;

  const canExecute =
    useObservation(
      () =>
        isExecutableOrchestration(orchestration)
          ? orchestration.canExecute$
          : Null$,
      [orchestration]
    ) ?? false;

  const timeRemaining =
    useObservation(situation?.timeRemaining$ ?? Null$) ?? Number.NaN;

  let timeRemainingStr: string | null = null;
  if (isOngoingOrchestration(orchestration)) {
    timeRemainingStr = timeRemaining.toFixed(1);
  }

  let stackItems: React.ReactNode[] = [];

  if (notes.length > 0) {
    stackItems.push(
      <TlgNote
        sx={{
          minHeight: 100,
          ["& .game-typography"]: {
            textAlign: "center",
          },
        }}
        elementStack={notes[notes.length - 1]}
      />
    );
  } else if (description) {
    stackItems.push(
      <GameTypography component="div" variant="body1" sx={{ minHeight: 100 }}>
        {description}
      </GameTypography>
    );
  }

  if (!isCompletedOrchestration(orchestration) && content.length > 0) {
    stackItems.push(
      <Stack
        direction="row"
        flexWrap="wrap"
        gap={2}
        justifyContent="center"
        alignItems="center"
      >
        {content.map((elementStack) => (
          <ElementStackIcon key={elementStack.id} elementStack={elementStack} />
        ))}
      </Stack>
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
  } else if (
    !isOngoingOrchestration(orchestration) &&
    !isCompletedOrchestration(orchestration)
  ) {
    stackItems.push(
      <Typography sx={{ height: 30, textAlign: "center" }}>
        Slot enough cards for a recipe to see its requirements.
      </Typography>
    );
  }

  if (isThresholdedOrchestration(orchestration)) {
    stackItems.push(
      <OrchestrationSlots
        sx={{ height: "100%" }}
        orchestration={orchestration}
      />
    );
  } else if (isContentContainingOrchestration(orchestration)) {
    stackItems.push(
      <ElementStackTray
        sx={{
          height: "100%",
          justifyContent: "center",
          alignContent: "center",
        }}
        elementStacks$={orchestration.content$}
      />
    );
  }

  stackItems.push(
    <Stack direction="row" sx={{ mt: "auto" }}>
      {timeRemainingStr && (
        <GameTypography key="timeRemaining" variant="h6" role="timer">
          {timeRemainingStr} seconds remain.
        </GameTypography>
      )}
      <ButtonGroup sx={{ ml: "auto" }}>
        {isThresholdedOrchestration(orchestration) && hasSlots && (
          <Button
            disabled={!canAutofill}
            onClick={() => orchestration.autofill()}
          >
            Autofill
          </Button>
        )}
        {isExecutableOrchestration(orchestration) && (
          <Button
            disabled={!canExecute}
            onClick={() => orchestration.execute()}
          >
            Start Recipe
          </Button>
        )}
        {isOngoingOrchestration(orchestration) && (
          <Button onClick={() => orchestration.passTime()}>Pass Time</Button>
        )}
        {isCompletedOrchestration(orchestration) && (
          <Button onClick={() => orchestration.conclude()}>Conclude</Button>
        )}
      </ButtonGroup>
    </Stack>
  );

  return (
    <Stack direction="column" sx={{ height: "100%" }}>
      <OrchestrationContentHeader
        title={label ?? "Orchestration"}
        onBack={onBack}
      />
      <Stack direction="column" spacing={2} sx={{ height: "100%", p: 2 }}>
        {stackItems.map((item, index) => (
          <React.Fragment key={index}>
            {index !== 0 && <Divider />}
            {item}
          </React.Fragment>
        ))}
      </Stack>
    </Stack>
  );
};

export default OrchestrationContent;
