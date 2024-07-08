import React from "react";

import { Box, Button, ButtonGroup, Divider, Stack } from "@mui/material";

import { useObservation } from "@/hooks/use-observation";

import { CompletedOrchestration } from "@/services/sh-game";

import TlgNote from "../Elements/TlgNote";

import GameTypography from "../GameTypography";

import ElementStackTray from "../Elements/ElementStackTray";

import OrchestrationContentHeader from "./OrchestratonContentHeader";

export interface CompletedOrchestrationContentProps {
  onBack(): void;
  orchestration: CompletedOrchestration;
}

const CompletedOrchestrationContent = ({
  orchestration,
  onBack,
}: CompletedOrchestrationContentProps) => {
  const label = useObservation(orchestration.label$);
  const description = useObservation(orchestration.description$);

  // TODO: Show browsable notes
  const notes =
    useObservation(() => orchestration.notes$, [orchestration]) ?? [];

  let stackItems: React.ReactNode[] = [];

  if (notes.length > 0) {
    stackItems.push(
      <TlgNote
        sx={{
          minHeight: 100,
          flexShrink: 0,
          ["& .game-typography"]: {
            textAlign: "center",
          },
        }}
        elementStack={notes[notes.length - 1]}
      />
    );
  } else if (description) {
    stackItems.push(
      <Box sx={{ minHeight: 100, flexShrink: 0 }}>
        <GameTypography component="div" variant="body1" aria-live="assertive">
          {description}
        </GameTypography>
      </Box>
    );
  }

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

  stackItems.push(
    <Stack direction="row" sx={{ mt: "auto" }}>
      <ButtonGroup sx={{ ml: "auto" }}>
        <Button onClick={() => orchestration.conclude()}>Conclude</Button>
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

export default CompletedOrchestrationContent;
