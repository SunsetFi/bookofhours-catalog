import React from "react";

import { styled, Typography, IconButton, Divider, Box } from "@mui/material";
import {
  ChevronRight as ChevronRightIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";

import { useDIDependency } from "@/container";

import { Orchestrator } from "@/services/sh-game";

const DrawerHeader = styled("div")(({ theme }) => ({
  position: "relative",
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
}));

export interface OrchestrationContentHeaderProps {
  title: string;
  onBack?(): void;
}

const OrchestrationContentHeader = ({
  title,
  onBack,
}: OrchestrationContentHeaderProps) => {
  const orchestrator = useDIDependency(Orchestrator);
  return (
    <>
      <DrawerHeader>
        {/* Play games with absolute positioning to make this the first thing the screen reader sees.*/}
        <Box
          sx={{
            position: "absolute",
            left: onBack ? 50 : 16,
            top: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
          }}
        >
          <Typography variant="h5" id="orchestration-drawer-title">
            {title}
          </Typography>
        </Box>
        {onBack && (
          <IconButton aria-label="Back to Actions List" onClick={onBack}>
            <ArrowBackIcon />
          </IconButton>
        )}

        <IconButton
          sx={{ ml: "auto" }}
          aria-label="Close Actions Drawer"
          aria-controls="orchestration-drawer"
          aria-expanded={true}
          onClick={() => orchestrator.toggleDrawer()}
        >
          <ChevronRightIcon />
        </IconButton>
      </DrawerHeader>
      <Divider aria-hidden="true" />
    </>
  );
};

export default OrchestrationContentHeader;
