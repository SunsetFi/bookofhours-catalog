import React from "react";

import { Box, Button, ButtonGroup, Divider, Stack } from "@mui/material";

import { Null$ } from "@/observables";

import { useObservation } from "@/hooks/use-observation";

import {
  OngoingOrchestration,
  isContentContainingOrchestration,
  isOngoingOrchestration,
  isThresholdedOrchestration,
} from "@/services/sh-game";

import TlgNote from "../Elements/TlgNote";
import ElementStackIcon from "../Elements/ElementStackIcon";

import GameTypography from "../GameTypography";

import OrchestrationContentHeader from "./OrchestratonContentHeader";

import OrchestrationSlots from "./OrchestrationSlots";
import RequireInteractivity from "../RequireInteractivity";

export interface OngoingOrchestrationContentProps {
  onBack(): void;
  orchestration: OngoingOrchestration;
}

const OngoingOrchestrationContent = ({
  orchestration,
  onBack,
}: OngoingOrchestrationContentProps) => {
  const label = useObservation(orchestration.label$);
  const description = useObservation(orchestration.description$);
  const situation = useObservation(orchestration.situation$);

  const canAutofill =
    useObservation(() => orchestration.canAutofill$, [orchestration]) ?? false;

  const notes =
    useObservation(
      () =>
        isContentContainingOrchestration(orchestration)
          ? orchestration.notes$
          : Null$,
      [orchestration],
    ) ?? [];

  const content =
    useObservation(
      () =>
        isContentContainingOrchestration(orchestration)
          ? orchestration.content$
          : Null$,
      [orchestration],
    ) ?? [];

  const timeRemaining =
    useObservation(situation?.timeRemaining$ ?? Null$) ?? Number.NaN;

  let timeRemainingStr: string | null = null;
  if (isOngoingOrchestration(orchestration)) {
    timeRemainingStr = timeRemaining.toFixed(1);
  }

  let stackItems: React.ReactNode[] = [];

  // TODO: Pageable notes
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
      />,
    );
  } else if (description) {
    stackItems.push(
      <Box sx={{ minHeight: 100, flexShrink: 0 }}>
        <GameTypography variant="body1" aria-live="assertive">
          {description}
        </GameTypography>
      </Box>,
    );
  }

  if (content.length > 0) {
    stackItems.push(
      <Stack
        direction="row"
        flexWrap="wrap"
        gap={2}
        justifyContent="center"
        alignItems="center"
      >
        {content.map((elementStack) => (
          <ElementStackIcon
            key={elementStack.id}
            elementStack={elementStack}
            interactive={false}
          />
        ))}
      </Stack>,
    );
  }

  stackItems.push(
    <OrchestrationSlots
      sx={{ height: "100%" }}
      orchestration={orchestration}
    />,
  );

  stackItems.push(
    <Stack direction="row" sx={{ mt: "auto" }}>
      {timeRemainingStr && (
        <GameTypography key="timeRemaining" variant="h6" role="timer">
          {timeRemainingStr} seconds remain.
        </GameTypography>
      )}
      <ButtonGroup sx={{ ml: "auto" }}>
        <RequireInteractivity interactivity="full" compare="greater">
          {isThresholdedOrchestration(orchestration) && canAutofill && (
            <Button
              disabled={!canAutofill}
              onClick={() => orchestration.autofill()}
            >
              Autofill
            </Button>
          )}
        </RequireInteractivity>
        <Button onClick={() => orchestration.passTime()}>Pass Time</Button>
      </ButtonGroup>
    </Stack>,
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

export default OngoingOrchestrationContent;
