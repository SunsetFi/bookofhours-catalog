import React from "react";

import { Box, Typography, useTheme, SxProps } from "@mui/material";
import { Lock as LockIcon } from "@mui/icons-material";

import { useDrag } from "react-dnd";

import { useObservation } from "@/hooks/use-observation";

import { ElementStackDraggable } from "@/draggables/element-stack";

import { ElementStackModel } from "@/services/sh-game";

import Tooltip from "../Tooltip";
import AutosizeTypography from "../AutosizeText";

import ElementStackDetails from "./ElementStackDetails";

export interface ElementStackCardProps {
  sx?: SxProps;
  elementStack: ElementStackModel;
  width?: number;
}

// Card is 256x406
// text area is 150 height
const aspectRatio = 1.59;

const textBackgroundColor = "#444";

const ElementStackCard = ({
  elementStack,
  width = 125,
  sx,
}: ElementStackCardProps) => {
  const theme = useTheme();
  const widthPx = `${width}px`;

  const iconUrl = useObservation(elementStack.iconUrl$);
  const label = useObservation(elementStack.label$) ?? "";
  const quantity = useObservation(elementStack.quantity$) ?? 0;
  const inExteriorSphere =
    useObservation(elementStack.inExteriorSphere$) ?? true;

  const [{ isDragging }, dragRef] = useDrag(
    () => ({
      type: ElementStackDraggable,
      item: { elementStack } satisfies ElementStackDraggable,
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [elementStack]
  );

  if (!iconUrl) {
    return null;
  }

  return (
    <Tooltip
      sx={sx}
      title={<ElementStackDetails elementStack={elementStack} />}
      disabled={isDragging}
    >
      <Box
        sx={{
          position: "relative",
        }}
      >
        <Box
          ref={dragRef}
          sx={{
            borderRadius: 2,
            display: "flex",
            flexDirection: "column",
            width: widthPx,
            height: `${width * aspectRatio}px`,
            backgroundColor: textBackgroundColor,
            overflow: "hidden",
            filter: !inExteriorSphere
              ? "brightness(75%) grayscale(0.8)"
              : undefined,
          }}
        >
          <Box
            sx={{
              width: widthPx,
              height: widthPx,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              aria-hidden="true"
              loading="lazy"
              src={iconUrl}
              title={label}
              style={{
                display: "block",
                maxWidth: "100%",
                maxHeight: "100%",
              }}
            />
          </Box>
          <Box
            sx={{
              width: "100%",
              height: "100%",
              minHeight: 0,
              p: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AutosizeTypography
              variant="body1"
              color={theme.palette.getContrastText(textBackgroundColor)}
              textAlign="center"
            >
              {label}
            </AutosizeTypography>
          </Box>
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
        {!inExteriorSphere && (
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

export default ElementStackCard;
