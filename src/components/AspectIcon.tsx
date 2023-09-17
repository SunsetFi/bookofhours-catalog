import * as React from "react";

import type { SxProps } from "@mui/material/styles";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Popper from "@mui/material/Popper";
import Typography from "@mui/material/Typography";

import { useObservation } from "@/observables";

import { useAspect } from "@/services/sh-compendium";

export interface AspectIconProps {
  aspectId: string;
  title?: string;
  size?: number;
  sx?: SxProps;
  onClick?(e: React.MouseEvent<HTMLElement>): void;
}

const AspectIcon = ({
  title,
  aspectId,
  size = 40,
  sx,
  onClick,
}: AspectIconProps) => {
  const [popupAnchor, setPopupAnchor] = React.useState<HTMLElement | null>(
    null
  );

  const aspect = useAspect(aspectId);
  const label = useObservation(aspect.label$) ?? "";
  const description = useObservation(aspect.description$) ?? "";

  const onMouseOver = React.useCallback((e: React.MouseEvent<HTMLElement>) => {
    setPopupAnchor(e.currentTarget);
  }, []);

  const onMouseOut = React.useCallback(() => {
    setPopupAnchor(null);
  }, []);

  return (
    <div onMouseOver={onMouseOver} onMouseOut={onMouseOut}>
      <Box
        sx={{
          cursor: onClick ? "pointer" : undefined,
          ...sx,
        }}
        onClick={onClick}
      >
        <img
          style={{ display: "block" }}
          src={aspect.iconUrl}
          alt={title ?? label ?? ""}
          width={size}
          height={size}
        />
      </Box>
      <Popper open={popupAnchor != null} anchorEl={popupAnchor!}>
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
              src={aspect.iconUrl}
              alt={label}
              title={label}
              style={{ width: "50px", height: "50px" }}
            />
            <Typography variant="body1">{label}</Typography>
          </Box>
          <Typography variant="body2">{description}</Typography>
        </Card>
      </Popper>
    </div>
  );
};

export default AspectIcon;
