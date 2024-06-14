import React from "react";
import { useDrag } from "react-dnd";

import { Box, Badge } from "@mui/material";

import { ElementStackDraggable } from "@/draggables/element-stack";

import { useObservation } from "@/hooks/use-observation";

import { ElementStackModel } from "@/services/sh-game";

import Tooltip from "../Tooltip";

import ElementStackDetails from "./ElementStackDetails";

export interface ElementStackIconProps {
  maxWidth?: number;
  maxHeight?: number;
  elementStack: ElementStackModel;
}

const ElementStackIcon = ({
  maxWidth,
  maxHeight,
  elementStack,
}: ElementStackIconProps) => {
  const iconUrl = useObservation(elementStack.iconUrl$);
  const label = useObservation(elementStack.label$) ?? "";
  const quantity = useObservation(elementStack.quantity$) ?? 1;

  if (!maxWidth && !maxHeight) {
    maxWidth = 40;
  }

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

  // This is stupid, but the screen reader is reading the invisible 0 from badge
  let content = (
    <Box
      ref={dragRef}
      sx={{
        width: maxWidth ? `${maxWidth}px` : undefined,
        height: maxHeight ? `${maxHeight}px` : undefined,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <img
        loading="lazy"
        src={iconUrl}
        alt={label}
        style={{ display: "block", maxWidth: "100%", maxHeight: "100%" }}
      />
    </Box>
  );

  if (quantity > 1) {
    content = (
      <Badge
        badgeContent={quantity > 1 ? quantity : 0}
        color="primary"
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        {content}
      </Badge>
    );
  }

  return (
    <Tooltip
      disabled={isDragging}
      title={<ElementStackDetails elementStack={elementStack} />}
    >
      {content}
    </Tooltip>
  );
};

export default ElementStackIcon;
