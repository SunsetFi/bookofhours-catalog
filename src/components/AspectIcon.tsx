import * as React from "react";

import type { SxProps } from "@mui/material/styles";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Popper from "@mui/material/Popper";
import Typography from "@mui/material/Typography";

import { useObservation } from "@/observables";

import { useAspect } from "@/services/sh-compendium";

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
  const [popupAnchor, setPopupAnchor] = React.useState<HTMLElement | null>(
    null
  );

  const aspect = useAspect(aspectId);
  const label = useObservation(aspect.label$) ?? "";
  const description = useObservation(aspect.description$) ?? "";
  const iconUrl = useObservation(aspect.iconUrl$);

  const onMouseOver = React.useCallback((e: React.MouseEvent<HTMLElement>) => {
    setPopupAnchor(e.currentTarget);
  }, []);

  const onMouseOut = React.useCallback(() => {
    setPopupAnchor(null);
  }, []);

  return (
    <>
      <Box
        {...props}
        component="span"
        aria-label={label}
        sx={{
          cursor: onClick ? "pointer" : undefined,
          ...sx,
        }}
        onMouseOver={onMouseOver}
        onMouseOut={onMouseOut}
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
      <Popper
        open={popupAnchor != null}
        anchorEl={popupAnchor!}
        sx={{
          pointerEvents: "none",
          // This is here because filters are done in a popper, and these icons are in those filters.
          // You would think that the new popper would order further on in the document from the portal, but nope.
          // FIXME: Fix AspectIcon z order issues.
          // I hate z indexes so much...  This is a disgustingly high value, but Popper is using 1300 by default.
          zIndex: 2000,
        }}
      >
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
              style={{ width: "50px" }}
            />
            <Typography variant="body1">{label}</Typography>
          </Box>
          <Typography variant="body2">{description}</Typography>
        </Card>
      </Popper>
    </>
  );
};

export default AspectIcon;
