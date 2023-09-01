import * as React from "react";
import { Aspects } from "secrethistories-api";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { GridRenderCellParams } from "@mui/x-data-grid";

import { useObservation } from "@/observables";

import { useAspect } from "@/services/sh-compendium/hooks";

interface AspectPresenceProps extends GridRenderCellParams<any, Aspects> {
  display: "label" | "level" | "none";
  allowedAspects: readonly string[] | ((aspectId: string) => boolean);
}

const AspectPresenceCell = ({
  display,
  allowedAspects,
  value = {},
}: AspectPresenceProps) => {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {Object.keys(value)
        .filter((aspectId) =>
          Array.isArray(allowedAspects)
            ? allowedAspects.includes(aspectId)
            : (allowedAspects as any)(aspectId)
        )
        .map((aspectId) => (
          <AspectPresenseItem
            key={aspectId}
            aspectId={aspectId}
            level={value[aspectId] ?? 0}
            display={display}
          />
        ))}
    </Box>
  );
};

export default AspectPresenceCell;

interface AspectPresenceItemProps {
  aspectId: string;
  level: number;
  display: AspectPresenceProps["display"];
}

const AspectPresenseItem = ({
  aspectId,
  level,
  display,
}: AspectPresenceItemProps) => {
  const aspect = useAspect(aspectId);
  const label = useObservation(aspect.label$);

  if (!label) {
    return null;
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: 2,
      }}
    >
      <img
        src={aspect.iconUrl}
        alt={label}
        title={label}
        width={50}
        height={50}
      />
      {display === "label" && (
        <Typography
          variant="body2"
          sx={{ whiteSpace: "break-spaces", width: "100%" }}
        >
          {label}
        </Typography>
      )}
      {display === "level" && <Typography variant="body2">{level}</Typography>}
    </Box>
  );
};
