import React from "react";

import { Box, Button, ButtonGroup, Divider, Stack } from "@mui/material";

import { Null$ } from "@/observables";

import { useObservation } from "@/hooks/use-observation";

import {
  Orchestration,
  isCompletedOrchestration,
  isContentContainingOrchestration,
  isExecutableOrchestration,
  isOngoingOrchestration,
  isVariableSituationOrchestration,
} from "@/services/sh-game";

import TlgNote from "../Elements/TlgNote";
import ElementStackIcon from "../Elements/ElementStackIcon";

import GameTypography from "../GameTypography";
import SituationSelectField from "../SituationSelectField";

import OrchestrationContentHeader from "./OrchestratonContentHeader";
import OrchestrationSlots from "../OrchestratorDialog/OrchestrationSlots";

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

  // TODO: Show browsable notes
  // const notes =
  //   useObservation(
  //     () =>
  //       isContentContainingOrchestration(orchestration)
  //         ? orchestration.notes$
  //         : Null$,
  //     [orchestration]
  //   ) ?? [];

  const content =
    useObservation(
      () =>
        isContentContainingOrchestration(orchestration)
          ? orchestration.content$
          : Null$,
      [orchestration]
    ) ?? [];

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

  if (description) {
    stackItems.push(
      <GameTypography key="description" component="div" variant="body1">
        {description}
      </GameTypography>
    );
  }

  // TODO: Show pagable notes
  // if (notes.length > 0) {
  //   stackItems.push(
  //     <TlgNote
  //       key="notes"
  //       sx={{
  //         minHeight: 75,
  //         ["& .game-typography"]: {
  //           textAlign: "center",
  //         },
  //       }}
  //       elementStack={notes[notes.length - 1]}
  //     />
  //   );
  // }

  if (content.length > 0) {
    stackItems.push(
      <Stack key="content" direction="row" flexWrap="wrap">
        {content.map((elementStack) => (
          <ElementStackIcon key={elementStack.id} elementStack={elementStack} />
        ))}
      </Stack>
    );
  }

  if (isVariableSituationOrchestration(orchestration)) {
    stackItems.push(
      <SituationSelectField
        key="situation"
        label="Workstation"
        fullWidth
        requireUnstarted
        situations$={orchestration.availableSituations$}
        value={situation ?? null}
        onChange={(s) => orchestration.selectSituation(s)}
      />
    );
  }

  if (!isCompletedOrchestration(orchestration)) {
    stackItems.push(
      <OrchestrationSlots
        key="slots"
        sx={{ height: "100%" }}
        orchestration={orchestration}
      />
    );
  }

  stackItems.push(
    <Stack key="actions" direction="row">
      {timeRemainingStr && (
        <GameTypography key="timeRemaining" variant="h6" role="timer">
          {timeRemainingStr} seconds remain.
        </GameTypography>
      )}
      <ButtonGroup sx={{ ml: "auto" }}>
        {isExecutableOrchestration(orchestration) && (
          <>
            <Button onClick={() => orchestration.prepare()}>
              Prepare Recipe
            </Button>
            <Button
              disabled={!canExecute}
              onClick={() => orchestration.execute()}
            >
              Start Recipe
            </Button>
          </>
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
