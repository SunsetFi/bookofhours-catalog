import React from "react";

import { styled, Typography, IconButton, Divider } from "@mui/material";
import {
  ChevronRight as ChevronRightIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";

import { useDIDependency } from "@/container";

import { Orchestrator } from "@/services/sh-game";

const DrawerHeader = styled("div")(({ theme }) => ({
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
        {onBack && (
          <IconButton aria-label="Back to Actions List" onClick={onBack}>
            <ArrowBackIcon />
          </IconButton>
        )}
        <Typography variant="h5" sx={{ ml: 2 }}>
          {title}
        </Typography>
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
      <Divider />
    </>
  );
};

export default OrchestrationContentHeader;
