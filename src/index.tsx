import "@/style.css";

import React from "react";
import ReactDOM from "react-dom/client";

import CssBaseline from "@mui/material/CssBaseline";

import { ContainerProvider } from "./container";
import ThemeProvider from "./theme";

import AppRouter from "./services/history/AppRouter";

import OrchestratorDialog from "./components/OrchestratorDialog";
import UnlockTerrainDialog from "./components/UnlockTerrainDialog";
import SearchDialog from "./components/SearchDialog";
import Favicon from "./components/Favicon";
import Hotkeys from "./components/Hotkeys";

import AppRoutes from "./routes";

const rootEl = document.getElementById("root");
const root = ReactDOM.createRoot(rootEl!);
root.render(
  <React.StrictMode>
    <ContainerProvider>
      <Hotkeys>
        <AppRouter>
          <Favicon />
          <ThemeProvider>
            <CssBaseline />
            <AppRoutes />
            <OrchestratorDialog />
            <UnlockTerrainDialog />
            <SearchDialog />
          </ThemeProvider>
        </AppRouter>
      </Hotkeys>
    </ContainerProvider>
  </React.StrictMode>
);
