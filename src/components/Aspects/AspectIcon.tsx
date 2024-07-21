import React from "react";

import { Box, Card, Typography, SxProps, styled } from "@mui/material";

import { useObservation } from "@/hooks/use-observation";

import { useAspect } from "@/services/sh-compendium";

import Tooltip from "../Tooltip";
import ScreenReaderContent from "../ScreenReaderContent";

const Img = styled("img")({});

export interface AspectIconProps
  extends Omit<
    React.HTMLAttributes<HTMLImageElement>,
    "width" | "height" | "src"
  > {
  aspectId: string;
  size?: number;
  sx?: SxProps;
}

const AspectIcon = ({
  aspectId,
  size = 40,
  sx,
  onClick,
  ...props
}: AspectIconProps) => {
  const aspect = useAspect(aspectId);
  const label = useObservation(aspect.label$) ?? "";
  const iconUrl = useObservation(aspect.iconUrl$);
  const hidden = useObservation(aspect.hidden$);

  if (hidden || !iconUrl) {
    return null;
  }

  return (
    <Tooltip title={<AspectDetails aspectId={aspectId} />}>
      <ScreenReaderContent>{label}</ScreenReaderContent>
      <Img
        aria-hidden="true"
        sx={{
          cursor: onClick ? "pointer" : undefined,
          ...sx,
        }}
        tabIndex={onClick ? 0 : undefined}
        onClick={onClick}
        loading="lazy"
        src={iconUrl}
        width={size}
        height={size}
        {...props}
      />
    </Tooltip>
  );
};

interface AspectDetailsProps {
  aspectId: string;
}
const AspectDetails = ({ aspectId }: AspectDetailsProps) => {
  const aspect = useAspect(aspectId);
  const label = useObservation(aspect.label$) ?? "";
  const description = useObservation(aspect.description$) ?? "";
  const iconUrl = useObservation(aspect.iconUrl$);

  return (
    <Card
      sx={{
        display: "flex",
        flexDirection: "column",
        maxWidth: 350,
        p: 2,
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirecton: "row",
          gap: 1,
          alignItems: "center",
          mb: 2,
        }}
      >
        <img
          loading="lazy"
          aria-hidden="true"
          src={iconUrl}
          style={{ display: "block", width: "50px" }}
        />
        <Typography variant="body1">{label}</Typography>
      </Box>
      <Typography variant="body2">{description}</Typography>
    </Card>
  );
};

export default AspectIcon;
