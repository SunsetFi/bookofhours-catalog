import React from "react";

import Badge from "@mui/material/Badge";

import { useObservation } from "@/hooks/use-observation";

import { ElementStackModel } from "@/services/sh-game";

import Tooltip from "../Tooltip";
import ElementStackDetails from "./ElementStackDetails";

export interface ElementStackIconProps {
  elementStack: ElementStackModel;
}

const ElementStackIcon = ({ elementStack }: ElementStackIconProps) => {
  const iconUrl = useObservation(elementStack.iconUrl$);
  const label = useObservation(elementStack.label$) ?? "";
  const quantity = useObservation(elementStack.quantity$) ?? 1;

  // This is stupid, but the screen reader is reading the invisible 0 from badge
  let content = (
    <img
      loading="lazy"
      src={iconUrl}
      alt={label}
      style={{ display: "block", maxWidth: "40px" }}
    />
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
    <Tooltip title={<ElementStackDetails elementStack={elementStack} />}>
      {content}
    </Tooltip>
  );
};

export default ElementStackIcon;
