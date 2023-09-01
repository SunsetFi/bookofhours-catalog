import * as React from "react";
import { Aspects } from "secrethistories-api";

import type { GridRenderCellParams } from "@mui/x-data-grid/models";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { useObservation } from "@/observables";

import { useAspect } from "@/services/sh-compendium/hooks";

export function renderAspects({
  value = {},
}: GridRenderCellParams<any, Aspects>) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 2,
      }}
    >
      {Object.keys(value).map((aspectId) => (
        <AspectListItem
          key={aspectId}
          aspectId={aspectId}
          level={value[aspectId] ?? 0}
        />
      ))}
    </Box>
  );
}

interface AspectListItemProps {
  aspectId: string;
  level: number;
}

const AspectListItem = ({ aspectId, level }: AspectListItemProps) => {
  const aspect = useAspect(aspectId);
  const label = useObservation(aspect.label$);

  if (!label) {
    return null;
  }

  return (
    <Box
      key={label}
      sx={{ display: "flex", flexDirection: "row", alignItems: "center" }}
    >
      <img
        src={aspect.iconUrl}
        alt={label}
        title={label}
        width={40}
        height={40}
      />
      <Typography variant="body2" sx={{ pl: 1 }}>
        {level}
      </Typography>
    </Box>
  );
};
