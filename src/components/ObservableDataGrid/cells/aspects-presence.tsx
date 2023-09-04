import * as React from "react";
import { Aspects } from "secrethistories-api";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { GridRenderCellParams } from "@mui/x-data-grid";

import { useObservation } from "@/observables";

import { useAspect } from "@/services/sh-compendium";

interface AspectPresenceProps
  extends GridRenderCellParams<any, readonly string[]> {
  display: "label" | "none";
  orientation: "horizontal" | "vertical";
}

const AspectPresenceCell = ({
  display,
  orientation,
  value = [],
}: AspectPresenceProps) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: orientation === "vertical" ? "column" : "row",
        gap: 1,
      }}
    >
      {value.map((aspectId) => (
        <AspectPresenseItem
          key={aspectId}
          aspectId={aspectId}
          display={display}
        />
      ))}
    </Box>
  );
};

export default AspectPresenceCell;

interface AspectPresenceItemProps {
  aspectId: string;
  display: AspectPresenceProps["display"];
}

const AspectPresenseItem = ({ aspectId, display }: AspectPresenceItemProps) => {
  const aspect = useAspect(aspectId);
  const label = useObservation(
    `aspectPresenceItem ${aspectId} label`,
    aspect.label$
  );

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
    </Box>
  );
};
