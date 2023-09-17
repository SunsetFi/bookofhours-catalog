import * as React from "react";
import { Aspects } from "secrethistories-api";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { useObservation } from "@/observables";

import { useAspect } from "@/services/sh-compendium";
import AspectIcon from "./AspectIcon";

export interface AspectsListProps {
  aspects: Aspects;
  iconSize?: number;
}

export const AspectsList = ({ aspects, iconSize }: AspectsListProps) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 2,
      }}
    >
      {Object.keys(aspects).map((aspectId) => (
        <AspectListItem
          key={aspectId}
          aspectId={aspectId}
          size={iconSize}
          level={aspects[aspectId] ?? 0}
        />
      ))}
    </Box>
  );
};

interface AspectListItemProps {
  aspectId: string;
  level: number;
  size?: number;
}

const AspectListItem = ({ aspectId, level, size }: AspectListItemProps) => {
  const aspect = useAspect(aspectId);
  const label = useObservation(aspect.label$);
  const isHidden = useObservation(aspect.isHidden$) ?? true;

  if (isHidden || !label) {
    return null;
  }

  return (
    <Box
      key={label}
      sx={{ display: "flex", flexDirection: "row", alignItems: "center" }}
    >
      <AspectIcon aspectId={aspectId} size={size} />
      <Typography variant="body2" sx={{ pl: 1 }}>
        {level}
      </Typography>
    </Box>
  );
};
