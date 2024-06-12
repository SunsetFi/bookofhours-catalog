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
  const form = useObservation(orchestrator.form$);
  const orchestration = useObservation(orchestrator.orchestration$);

  return (
    <StyledDrawer
      open={form === "drawer"}
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
