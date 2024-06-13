import React from "react";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme, type SxProps } from "@mui/material/styles";

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
      <Box sx={{ position: "relative" }}>
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
              borderRadius: "16px",
              backgroundColor: "#ABB",
              color: theme.palette.getContrastText("#ABB"),
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
      </Box>
    </Tooltip>
  );
};

export default ElementStackCard;
