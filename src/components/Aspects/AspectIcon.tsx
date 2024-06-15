import React from "react";

import type { SxProps } from "@mui/material/styles";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";

import { useObservation } from "@/hooks/use-observation";

import { useAspect } from "@/services/sh-compendium";

import Tooltip from "../Tooltip";

export interface AspectIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  aspectId: string;
  size?: number;
  sx?: SxProps;
  onClick?(e: React.MouseEvent<HTMLElement>): void;
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

  if (!hidden) {
    return null;
  }

  return (
    <Tooltip title={<AspectDetails aspectId={aspectId} />}>
      <Box
        {...props}
        component="span"
        aria-label={label}
        sx={{
          cursor: onClick ? "pointer" : undefined,
          ...sx,
        }}
        tabIndex={onClick ? 0 : undefined}
        onClick={onClick}
      >
        {iconUrl && (
          <img
            aria-hidden="true"
            loading="lazy"
            style={{ display: "block" }}
            src={iconUrl}
            alt={label ?? ""}
            width={size}
            height={size}
          />
        )}
      </Box>
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
          src={iconUrl}
          alt={label}
          title={label}
          style={{ display: "block", width: "50px" }}
        />
        <Typography variant="body1">{label}</Typography>
      </Box>
      <Typography variant="body2">{description}</Typography>
    </Card>
  );
};

export default AspectIcon;
