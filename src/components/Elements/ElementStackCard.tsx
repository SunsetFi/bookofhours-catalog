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
  interactable?: boolean;
  role?: string;
  ["aria-selected"]?: boolean;
  onClick?(): void;
}

// Card is 256x406
// text area is 150 height
export const ElementStackCardAspectRatio = 1.59;

export const DefaultElementStackCardWidth = 125;
export const DefaultElementStackCardHeight =
  DefaultElementStackCardWidth * ElementStackCardAspectRatio;

const textBackgroundColor = "#444";

const ElementStackCard = ({
  elementStack,
  width = DefaultElementStackCardWidth,
  sx,
  interactable = true,
  role,
  ["aria-selected"]: ariaSelected,
  onClick,
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
      canDrag: interactable,
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [elementStack, interactable]
  );

  const onKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && onClick) {
        e.preventDefault();
        onClick();
      }
    },
    [onClick]
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
          component="div"
          className="element-stack-card--card"
          sx={{
            borderRadius: 2,
            display: "flex",
            flexDirection: "column",
            width: widthPx,
            height: `${width * ElementStackCardAspectRatio}px`,
            backgroundColor: textBackgroundColor,
            overflow: "hidden",
            filter:
              interactable && !inExteriorSphere
                ? "brightness(75%) grayscale(0.8)"
                : undefined,
            cursor: interactable && onClick ? "pointer" : undefined,
          }}
          onClick={interactable ? onClick : undefined}
          tabIndex={interactable && onClick ? 0 : undefined}
          onKeyDown={onKeyDown}
          role={role}
          aria-selected={ariaSelected}
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
              minWidth: "28px",
              height: "28px",
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
        {interactable && !inExteriorSphere && (
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
