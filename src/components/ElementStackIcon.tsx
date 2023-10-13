import * as React from "react";

import Popper from "@mui/material/Popper";
import Badge from "@mui/material/Badge";

import { useObservation } from "@/hooks/use-observation";

import { ElementStackModel } from "@/services/sh-game";

import ElementStackDetails from "./ElementStackDetails";

export interface ElementStackIconProps {
  elementStack: ElementStackModel;
}

const ElementStackIcon = ({ elementStack }: ElementStackIconProps) => {
  const [popupAnchor, setPopupAnchor] = React.useState<HTMLElement | null>(
    null
  );

  const iconUrl = useObservation(elementStack.iconUrl$);
  const label = useObservation(elementStack.label$) ?? "";
  const quantity = useObservation(elementStack.quantity$) ?? 1;

  const onMouseOver = React.useCallback((e: React.MouseEvent<HTMLElement>) => {
    setPopupAnchor(e.currentTarget);
  }, []);

  const onMouseOut = React.useCallback(() => {
    setPopupAnchor(null);
  }, []);

  // This is stupid, but the screen reader is reading the invisible 0 from badge
  let content = (
    <img
      loading="lazy"
      src={iconUrl}
      alt={label}
      style={{ maxWidth: "40px" }}
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
    <div onMouseOver={onMouseOver} onMouseOut={onMouseOut}>
      {content}
      <Popper
        open={popupAnchor != null}
        anchorEl={popupAnchor!}
        sx={{
          pointerEvents: "none",
        }}
      >
        <ElementStackDetails elementStack={elementStack} />
      </Popper>
    </div>
  );
};

export default ElementStackIcon;
