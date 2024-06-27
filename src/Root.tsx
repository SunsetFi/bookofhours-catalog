import React from "react";
import { Box, CircularProgress, Typography } from "@mui/material";

import { useDIDependency } from "./container";

import AppRoutes from "./routes";

import { SaveManager } from "./services/sh-game/SaveManager";
import { useIsGameRunning, useIsLegacyRunning } from "./services/sh-game";

import { useObservation } from "./hooks/use-observation";

import Hotkeys from "./components/Hotkeys";
import UnlockTerrainDialog from "./components/UnlockTerrainDialog";
import SearchDialog from "./components/SearchDialog";

import GameNotRunningView from "./views/GameNotRunningView";
import ChooseGameView from "./views/ChooseGameView";

const Root = () => {
  const saveManager = useDIDependency(SaveManager);
  const loadingState = useObservation(saveManager.loadingState$);

  const isRunning = useIsGameRunning();
  const isLegacyRunning = useIsLegacyRunning();

  if (!isRunning) {
    return <GameNotRunningView />;
  }

  if (loadingState !== "idle") {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          width: "100%",
          height: "100%",
        }}
      >
        <Typography variant="h4">
          {loadingState === "game-loading"
            ? "Loading game..."
            : "Loading Catalogue..."}
        </Typography>
        <CircularProgress sx={{ mt: 1 }} color="inherit" />
      </Box>
    );
  }

  if (!isLegacyRunning) {
    return <ChooseGameView />;
  }

  return (
    <Hotkeys>
      <AppRoutes />
      <UnlockTerrainDialog />
      <SearchDialog />
    </Hotkeys>
  );
};

export default Root;
