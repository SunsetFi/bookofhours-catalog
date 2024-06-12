import React from "react";
import { mapValues } from "lodash";

import { Box, SxProps } from "@mui/material";

import { Null$ } from "@/observables";

import { useObservation } from "@/hooks/use-observation";

import {
  Orchestration,
  isContentContainingOrchestration,
  isExecutableOrchestration,
} from "@/services/sh-game";

import AspectsList from "../Aspects/AspectsList";

import GameTypography from "../GameTypography";
import TlgNote from "../Elements/TlgNote";
import ElementStackIcon from "../Elements/ElementStackIcon";

interface OrchestrationSidebarProps {
  sx?: SxProps;
  orchestration: Orchestration;
}

const OrchestrationSidebar = ({
  sx,
  orchestration,
}: OrchestrationSidebarProps) => {
  const requirements = useObservation(orchestration.requirements$) ?? {};
  const aspects = useObservation(orchestration.aspects$) ?? {};

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

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        width: 400,
        ...sx,
      }}
    >
      {Object.keys(requirements).length > 0 && (
        <AspectsList
          sx={{ mb: 3 }}
          aspects={mapValues(
            requirements,
            (value, key) => `${aspects[key] ?? 0} / ${value}`
          )}
          iconSize={30}
        />
      )}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
          pr: 1,
          overflow: "auto",
          height: "100%",
        }}
      >
        {startDescription && (
          <GameTypography component="div" variant="body2">
            {startDescription}
          </GameTypography>
        )}
        {/* TODO: Show all notes paginated */}
        {notes.length > 0 && <TlgNote elementStack={notes[notes.length - 1]} />}
        {content.map((elementStack, index) => (
          <ElementStackIcon key={index} elementStack={elementStack} />
        ))}
      </Box>
    </Box>
  );
};

export default OrchestrationSidebar;
