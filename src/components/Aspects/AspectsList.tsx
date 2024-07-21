import React from "react";
import { sortBy } from "lodash";

import { Box, Typography, SxProps } from "@mui/material";

import { useObservation } from "@/hooks/use-observation";
import { aspectOrder } from "@/aspects";

import { useAspect } from "@/services/sh-compendium";

import AspectIcon from "./AspectIcon";

export interface AspectsListProps {
  sx?: SxProps;
  aspects: Readonly<Record<string, React.ReactNode>>;
  iconSize?: number;
}

const AspectsList = ({ sx, aspects, iconSize }: AspectsListProps) => {
  return (
    <Box
      className="aspects-list"
      sx={{
        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 1,
        ...sx,
      }}
    >
      {sortBy(Object.keys(aspects), aspectOrder).map((aspectId) => (
        <AspectListItem key={aspectId} aspectId={aspectId} size={iconSize}>
          {aspects[aspectId]}
        </AspectListItem>
      ))}
    </Box>
  );
};

export default AspectsList;

interface AspectListItemProps {
  aspectId: string;
  size?: number;
  children: React.ReactNode;
}

const AspectListItem = ({ aspectId, size, children }: AspectListItemProps) => {
  const aspect = useAspect(aspectId);
  const label = useObservation(aspect.label$);
  const isHidden = useObservation(aspect.hidden$) ?? true;

  if (isHidden || !label) {
    return null;
  }

  return (
    <Box
      key={label}
      sx={{ display: "flex", flexDirection: "row", alignItems: "center" }}
    >
      <AspectIcon aspectId={aspectId} size={size} />
      {children && (
        <Typography component="span" variant="body2" sx={{ pl: 1 }}>
          {children}
        </Typography>
      )}
    </Box>
  );
};
