import React from "react";

import { Box, Typography, CircularProgress, SxProps } from "@mui/material";

import { useDIDependency } from "@/container";

import { useObservation } from "@/hooks/use-observation";

import { TokensSource, filterHasAnyAspect } from "@/services/sh-game";

import ElementStackIcon from "./Elements/ElementStackIcon";

export interface HandOverviewIconsProps {
  sx?: SxProps;
}

const HandOverviewIcons = ({ sx }: HandOverviewIconsProps) => {
  const tokensSource = useDIDependency(TokensSource);
  const elements = useObservation(
    () =>
      tokensSource.visibleElementStacks$.pipe(
        filterHasAnyAspect(["memory", "weather", "assistance", "visitor"])
      ),
    [tokensSource.visibleElementStacks$]
  );

  return (
    <Box
      role="region"
      aria-label="Hand overview"
      aria-live="polite"
      sx={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: 1,
        ...sx,
      }}
    >
      {elements == null && <CircularProgress color="inherit" />}
      {elements && (
        <>
          {elements.slice(0, 10).map((element) => (
            <ElementStackIcon key={element.id} elementStack={element} />
          ))}
          {elements.length >= 10 && <Typography>...</Typography>}
        </>
      )}
    </Box>
  );
};

export default HandOverviewIcons;
