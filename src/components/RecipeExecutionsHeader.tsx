import React from "react";

import { Badge, IconButton, SxProps } from "@mui/material";

import { PlayCircle } from "@mui/icons-material";

import { useDIDependency } from "@/container";

import { useObservation } from "@/hooks/use-observation";

import { Orchestrator } from "@/services/sh-game";

import RequireInteractivity from "./RequireInteractivity";

interface RecipeExecutionsHeaderProps {
  sx?: SxProps;
}

const RecipeExecutionsHeader = ({ sx }: RecipeExecutionsHeaderProps) => {
  const orchestrator = useDIDependency(Orchestrator);
  const open = useObservation(orchestrator.open$);
  const executingSituations =
    useObservation(orchestrator.executingSituations$) ?? [];

  const onClick = React.useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      e.preventDefault();
      orchestrator.toggleDrawer();
    },
    [orchestrator],
  );

  if (open) {
    return null;
  }

  return (
    <RequireInteractivity interactivity="minimal" compare="greater">
      <Badge
        role="region"
        aria-label="Open Activities Drawer"
        badgeContent={executingSituations.length}
        color="primary"
        sx={{
          ["& .MuiBadge-badge"]: {
            right: 10,
            top: 10,
          },
          ...sx,
        }}
      >
        <IconButton
          aria-controls="orchestration-drawer"
          aria-expanded={open}
          title="Actions"
          onClick={onClick}
        >
          <PlayCircle />
        </IconButton>
      </Badge>
    </RequireInteractivity>
  );
};

export default RecipeExecutionsHeader;
