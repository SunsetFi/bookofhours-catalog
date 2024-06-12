import React from "react";

import { Divider, Stack } from "@mui/material";

import { Null$ } from "@/observables";

import { useObservation } from "@/hooks/use-observation";

import {
  Orchestration,
  isContentContainingOrchestration,
  isExecutableOrchestration,
} from "@/services/sh-game";

import GameTypography from "../GameTypography";
import TlgNote from "../Elements/TlgNote";
import ElementStackIcon from "../Elements/ElementStackIcon";

import OrchestrationContentHeader from "./OrchestratonContentHeader";

export interface OrchestrationContentProps {
  onBack(): void;
  orchestration: Orchestration;
}

const OrchestrationContent = ({
  orchestration,
  onBack,
}: OrchestrationContentProps) => {
  const label = useObservation(orchestration.label$);

  const startDescription = useObservation(
    () =>
      isExecutableOrchestration(orchestration)
        ? orchestration.startDescription$
        : Null$,
    [orchestration]
  );

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

  const slots = useObservation(orchestration.slots$) ?? [];

  let stackItems: React.ReactNode[] = [];

  if (startDescription) {
    stackItems.push(
      <GameTypography key="startDescription" variant="h6">
        {startDescription}
      </GameTypography>
    );
  }

  if (notes.length > 0) {
    stackItems.push(
      <TlgNote key="notes" elementStack={notes[notes.length - 1]} />
    );
  }

  if (content.length > 0) {
    stackItems.push(
      <React.Fragment key="content">
        {content.map((elementStack, index) => (
          <ElementStackIcon key={index} elementStack={elementStack} />
        ))}
      </React.Fragment>
    );
  }

  return (
    <Stack direction="column">
      <OrchestrationContentHeader
        title={label ?? "Orchestration"}
        onBack={onBack}
      />
      <Stack direction="column" spacing={2} sx={{ p: 2 }}>
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
