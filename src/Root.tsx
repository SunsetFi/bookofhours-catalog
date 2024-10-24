import React from "react";
import {
  Box,
  CircularProgress,
  Stack,
  styled,
  Typography,
} from "@mui/material";

import { useDIDependency } from "./container";

import AppRoutes from "./routes";

import { SaveManager } from "./services/sh-game/SaveManager/SaveManager";
import { useIsGameRunning, useIsLegacyRunning } from "./services/sh-game";

import { useObservation } from "./hooks/use-observation";

import Hotkeys from "./components/Hotkeys";
import UnlockTerrainDialog from "./components/UnlockTerrainDialog";
import SearchDialog from "./components/SearchDialog";
import OrchestratorDrawer from "./components/OrchestratorDrawer";
import GameNotPausedWarning from "./components/GameNotPausedWarning";
import UpdateAvailableNotification from "./components/UpdateAvailableNotification";
import PageHeader from "./components/PageHeader";
import PageTabs from "./components/PageTabs";

import GameNotRunningView from "./views/GameNotRunningView";
import ChooseGameView from "./views/ChooseGameView";

const Main = styled("main")({
  flexGrow: 1,
  position: "relative",
  width: "100%",
  height: "100%",
  // CHROME HACK: Chrome is expanding main's scroll area to fit the entire unscrolled table,
  // even though the table is inside a flex container with overflow: auto.
  // Firefox works fine...
  overflow: "hidden",
  minWidth: 0,
  isolation: "isolate",
});

const Root = () => {
  const saveManager = useDIDependency(SaveManager);
  const loadingState = useObservation(saveManager.loadingState$);

  const isRunning = useIsGameRunning();
  const isLegacyRunning = useIsLegacyRunning();

  if (!isRunning) {
    return <GameNotRunningView />;
  }

  if (loadingState !== "idle") {
    let message: string;
    switch (loadingState) {
      case "game-loading":
        message = "Loading game...";
        break;
      case "tokens-loading":
        message = "Loading Catalogue...";
        break;
      case "game-saving":
        message = "Saving game...";
        break;
      default:
        message = "Busy...";
        break;
    }
    return (
      <Main
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          width: "100%",
          height: "100%",
        }}
      >
        <Typography variant="h4">{message}</Typography>
        <CircularProgress sx={{ mt: 1 }} color="inherit" />
      </Main>
    );
  }

  if (!isLegacyRunning) {
    return <ChooseGameView />;
  }

  return (
    <SuspenseBoundary>
      <Hotkeys>
        <Stack direction="row" sx={{ width: "100%", height: "100%" }}>
          <Stack
            direction="column"
            sx={{
              width: "100%",
              height: "100%",
              minWidth: 0,
            }}
          >
            <PageHeader />
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                flexGrow: 1,
                width: "100%",
                height: "100%",
                minHeight: 0,
              }}
            >
              <PageTabs />
              <Main aria-labelledby="page-title">
                <SuspenseBoundary>
                  <AppRoutes />
                </SuspenseBoundary>
              </Main>
            </Box>
          </Stack>
          <OrchestratorDrawer />
        </Stack>
        <UnlockTerrainDialog />
        <SearchDialog />
        <GameNotPausedWarning />
        <UpdateAvailableNotification />
      </Hotkeys>
    </SuspenseBoundary>
  );
};

const SuspenseBoundary = ({ children }: { children: React.ReactNode }) => {
  return (
    <React.Suspense
      fallback={
        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <CircularProgress color="inherit" />
        </Box>
      }
    >
      {children}
    </React.Suspense>
  );
};

export default Root;
