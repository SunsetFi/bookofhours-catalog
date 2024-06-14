import React from "react";

import { Drawer, styled } from "@mui/material";

import { useDIDependency } from "@/container";

import { useObservation } from "@/hooks/use-observation";

import { Orchestrator } from "@/services/sh-game";

import OrchestrationListContent from "./OrchestrationListContent";
import OrchestrationContent from "./OrchestrationContent";

const OrchestrationListWidth = 400;
const OrchestrationContentWidth = 650;

const StyledDrawer = styled(
  Drawer,
  {}
)<{ width: number }>(({ theme, open, width }) => ({
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  width: 0,
  ...(open && {
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    width,
  }),
  ["& .MuiDrawer-paper"]: {
    width,
  },
}));

const OrchestratorDrawer = () => {
  const orchestrator = useDIDependency(Orchestrator);
  const open = useObservation(orchestrator.open$);
  const orchestration = useObservation(orchestrator.orchestration$);

  // Getting some frames where open is undefined, causing the drawer to think its closed, and resulting in
  // it rerunning its animation when it realizes it is open.
  if (open === undefined) {
    return null;
  }

  return (
    <StyledDrawer
      open={open}
      anchor="right"
      variant="persistent"
      width={orchestration ? OrchestrationContentWidth : OrchestrationListWidth}
    >
      {orchestration == null && <OrchestrationListContent />}
      {orchestration != null && (
        <OrchestrationContent
          orchestration={orchestration}
          onBack={() => orchestrator.closeOrchestration()}
        />
      )}
    </StyledDrawer>
  );
};

export default OrchestratorDrawer;
