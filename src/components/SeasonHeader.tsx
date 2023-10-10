import * as React from "react";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import type { SxProps } from "@mui/material/styles";

import { useDIDependency } from "@/container";

import { useObservation } from "@/hooks/use-observation";
import { TimeSource } from "@/services/sh-game";

export interface SeasonHeaderProps {
  sx?: SxProps;
}
const SeasonHeader = ({ sx }: SeasonHeaderProps) => {
  const timeSource = useDIDependency(TimeSource);
  const seasonName = useObservation(timeSource.seasonName$);
  const seasonDescription = useObservation(timeSource.seasonDescription$);
  const daysInSeason = useObservation(timeSource.daysUntilNextSeason$);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        ...sx,
      }}
    >
      <Tooltip title={seasonDescription}>
        <Typography variant="body1" sx={{ mr: 1 }}>
          {seasonName}
        </Typography>
      </Tooltip>
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        {daysInSeason} day{daysInSeason != 1 ? "s" : ""} remain
        {daysInSeason == 1 ? "s" : ""}
      </Typography>
    </Box>
  );
};

export default SeasonHeader;
