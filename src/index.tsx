import "@/style.css";

import React from "react";
import ReactDOM from "react-dom/client";

import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import CssBaseline from "@mui/material/CssBaseline";

import { ContainerProvider } from "./container";
import ThemeProvider from "./theme";

import AppRouter from "./services/history/AppRouter";

import Favicon from "./components/Favicon";
import DialogServiceDialog from "./components/DialogService";

import Root from "./Root";

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
            <DialogServiceDialog />
            <Root />
          </ThemeProvider>
        </AppRouter>
      </DndProvider>
    </ContainerProvider>
  </React.StrictMode>
);
