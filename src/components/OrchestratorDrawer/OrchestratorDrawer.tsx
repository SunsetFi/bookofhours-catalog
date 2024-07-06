import React from "react";

import { Box, Drawer, styled } from "@mui/material";

import { useDIDependency } from "@/container";

import { useObservation } from "@/hooks/use-observation";

import { Orchestrator } from "@/services/sh-game";

import OrchestrationListContent from "./OrchestrationListContent";
import OrchestrationContent from "./OrchestrationContent";
import OrchestrationThumbs from "./OrchestrationThumbs";

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
  // Hack: We need to know immediately if this is open or not in order to properly
  // focus the panel when it opens.  We need to know immediately so as to not
  // focus on page changes before the observable propogates.
  const open = useObservation(orchestrator.open$) ?? orchestrator.open;
  const orchestration =
    useObservation(orchestrator.orchestration$) ?? orchestrator.orchestration;

  const contentRef = React.useRef<HTMLElement | null>(null);
  // More hacks: We should probably just listen to the observable for changes.
  const lastOrchestration = React.useRef(orchestration);

  React.useEffect(() => {
    if (contentRef.current == null) {
      return;
    }

    if (contentRef.current.contains(document.activeElement)) {
      // We already have focus somewhere inside us, don't re-focus.
      lastOrchestration.current = orchestration;
      return;
    }

    // Note: We check lastOrchestration here as we want to focus the content when the orchestration changes.
    // Orchestrations may auto-change due to time jumps, but the only way to do that while an orchestration is open
    // is from within the orchestration itself.
    // We do risk having this trigger if the game is not in a paused state, but that is not a case we
    // particularly care about.
    if (open || lastOrchestration.current != orchestration) {
      contentRef.current.focus();
    }

    lastOrchestration.current = orchestration;
  }, [open, orchestration]);

  return (
    <>
      <OrchestrationThumbs />
      <StyledDrawer
        open={open}
        anchor="right"
        variant="persistent"
        aria-labelledby="orchestration-drawer-title"
        width={
          orchestration ? OrchestrationContentWidth : OrchestrationListWidth
        }
      >
        <Box
          ref={contentRef}
          tabIndex={0}
          sx={{ width: "100%", height: "100%" }}
          role="region"
          id="orchestration-drawer"
          aria-label="Activities"
          aria-expanded="true"
        >
          {orchestration == null && <OrchestrationListContent />}
          {orchestration != null && (
            <OrchestrationContent
              orchestration={orchestration}
              onBack={() => orchestrator.closeOrchestration()}
            />
          )}
        </Box>
      </StyledDrawer>
    </>
  );
};

export default OrchestratorDrawer;
