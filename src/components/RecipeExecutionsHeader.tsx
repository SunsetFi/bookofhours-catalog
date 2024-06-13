import React from "react";

import { map } from "rxjs";

import { Badge, IconButton, SxProps } from "@mui/material";

import { PlayCircle } from "@mui/icons-material";

import { useDIDependency } from "@/container";
import { filterItemObservations } from "@/observables";

import { useObservation } from "@/hooks/use-observation";

import { TokensSource, Orchestrator } from "@/services/sh-game";

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
    [orchestrator]
  );

  if (open) {
    return null;
  }

  return (
    <Badge
      role="region"
      aria-label="Recipe Executions"
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
      <IconButton aria-haspopup="menu" title="Orchestrations" onClick={onClick}>
        <PlayCircle />
      </IconButton>
    </Badge>
  );
};

export default RecipeExecutionsHeader;
