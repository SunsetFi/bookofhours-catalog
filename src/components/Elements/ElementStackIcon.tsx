import React from "react";
import { useDrag } from "react-dnd";

import { Box, SxProps, Typography, useTheme } from "@mui/material";
import { Lock as LockIcon } from "@mui/icons-material";

import { ElementStackDraggable } from "@/draggables/element-stack";

import { useObservation } from "@/hooks/use-observation";

import { ElementStackModel } from "@/services/sh-game";

import Tooltip from "../Tooltip";

import ElementStackDetails from "./ElementStackDetails";

export interface ElementStackIconProps {
  maxWidth?: number;
  maxHeight?: number;
  elementStack: ElementStackModel;
  sx?: SxProps;
  interactive?: boolean;
}

const ElementStackIcon = ({
  maxWidth,
  maxHeight,
  elementStack,
  sx,
  interactive = true,
}: ElementStackIconProps) => {
  const theme = useTheme();
  const label = useObservation(elementStack.label$);
  const iconUrl = useObservation(elementStack.iconUrl$);
  const quantity = useObservation(elementStack.quantity$) ?? 1;
  const inExteriorSphere =
    useObservation(elementStack.inExteriorSphere$) ?? true;

  if (!maxWidth && !maxHeight) {
    maxWidth = 40;
  }

  const [{ isDragging }, dragRef] = useDrag(
    () => ({
      type: ElementStackDraggable,
      item: { elementStack } satisfies ElementStackDraggable,
      canDrag: inExteriorSphere && interactive,
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [elementStack, inExteriorSphere, interactive]
  );

  if (!label || !iconUrl) {
    return null;
  }

  return (
    <Tooltip
      sx={sx}
      disabled={isDragging}
      title={<ElementStackDetails elementStack={elementStack} />}
    >
      <Box
        aria-label={label}
        sx={{
          position: "relative",
        }}
      >
        <Box
          ref={dragRef}
          sx={{
            width: maxWidth ? `${maxWidth}px` : undefined,
            height: maxHeight ? `${maxHeight}px` : undefined,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            filter:
              interactive && !inExteriorSphere
                ? "brightness(75%) grayscale(0.8)"
                : undefined,
          }}
        >
          <img
            loading="lazy"
            style={{ display: "block", maxWidth: "100%", maxHeight: "100%" }}
            src={iconUrl}
          />
        </Box>
        {quantity > 1 && (
          <Typography
            component="div"
            variant="body1"
            sx={{
              minWidth: "32px",
              height: "32px",
              border: "2px solid #888",
              borderRadius: "50%",
              backgroundColor: "#CCC",
              color: theme.palette.getContrastText("#CCC"),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "absolute",
              bottom: -10,
              right: -10,
              zIndex: 1,
            }}
          >
            {quantity}
          </Typography>
        )}
        {interactive && !inExteriorSphere && (
          <Box
            sx={{
              border: "2px solid #888",
              borderRadius: "50%",
              backgroundColor: "#CCC",
              color: theme.palette.getContrastText("#CCC"),
              height: "32px",
              width: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "absolute",
              top: -10,
              left: -10,
              zIndex: 1,
            }}
          >
            <LockIcon
              aria-hidden={false}
              aria-label="This card is currently in use"
              color="inherit"
              scale={0.8}
            />
          </Box>
        )}
      </Box>
    </Tooltip>
  );
};

export default ElementStackIcon;
