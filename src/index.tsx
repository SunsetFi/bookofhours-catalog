import "@/style.css";

import React from "react";
import ReactDOM from "react-dom/client";

import { Box, Typography } from "@mui/material";

import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import CssBaseline from "@mui/material/CssBaseline";

import { ContainerProvider, useDIDependency } from "./container";
import ThemeProvider from "./theme";

import AppRouter from "./services/history/AppRouter";
import { SaveManager } from "./services/sh-game/SaveManager";
import { useIsGameRunning, useIsLegacyRunning } from "./services/sh-game";

import { useObservation } from "./hooks/use-observation";

import UnlockTerrainDialog from "./components/UnlockTerrainDialog";
import SearchDialog from "./components/SearchDialog";
import Favicon from "./components/Favicon";
import Hotkeys from "./components/Hotkeys";

import AppRoutes from "./routes";

import ChooseGameView from "./views/ChooseGameView";
import GameNotRunningView from "./views/GameNotRunningView";

const Root = () => {
  const saveManager = useDIDependency(SaveManager);
  const isLoading = useObservation(saveManager.isLoading$);

  const isRunning = useIsGameRunning();
  const isLegacyRunning = useIsLegacyRunning();

  if (!isRunning) {
    return <GameNotRunningView />;
  }

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
        }}
      >
        <Typography variant="h4">Loading game...</Typography>
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

const rootEl = document.getElementById("root");
const root = ReactDOM.createRoot(rootEl!);
root.render(
  <React.StrictMode>
    <ContainerProvider>
      <DndProvider backend={HTML5Backend}>
        <AppRouter>
          <Favicon />
          <ThemeProvider>
            <CssBaseline />
            <Root />
          </ThemeProvider>
        </AppRouter>
      </DndProvider>
    </ContainerProvider>
  </React.StrictMode>
);
