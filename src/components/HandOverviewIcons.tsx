import * as React from "react";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { SxProps } from "@mui/material";

import { useDIDependency } from "@/container";

import { useObservation } from "@/hooks/use-observation";

import { TokensSource, filterHasAnyAspect } from "@/services/sh-game";

import ElementStackIcon from "./ElementStackIcon";

export interface HandOverviewIconsProps {
  sx?: SxProps;
}

const HandOverviewIcons = ({ sx }: HandOverviewIconsProps) => {
  const tokensSource = useDIDependency(TokensSource);
  const elements =
    useObservation(
      () =>
        tokensSource.visibleElementStacks$.pipe(
          filterHasAnyAspect(["memory", "weather", "assistance"])
        ),
      []
    ) ?? [];

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        gap: 1,
        ...sx,
      }}
    >
      {elements.slice(0, 10).map((element) => (
        <ElementStackIcon key={element.id} elementStack={element} />
      ))}
      {elements.length >= 10 && <Typography>...</Typography>}
    </Box>
  );
};

export default HandOverviewIcons;
