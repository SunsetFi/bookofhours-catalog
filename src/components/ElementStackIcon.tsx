import * as React from "react";

import Popper from "@mui/material/Popper";
import Badge from "@mui/material/Badge";

import { useObservation } from "@/observables";

import { ElementStackModel } from "@/services/sh-game";

import ElementStackDetails from "./ElementStackDetails";

export interface ElementStackIconProps {
  elementStack: ElementStackModel;
}

const ElementStackIcon = ({ elementStack }: ElementStackIconProps) => {
  const [popupAnchor, setPopupAnchor] = React.useState<HTMLElement | null>(
    null
  );

  const iconUrl = elementStack.iconUrl;
  const label = useObservation(elementStack.label$) ?? "";
  const quantity = useObservation(elementStack.quantity$) ?? 1;

  const onMouseOver = React.useCallback((e: React.MouseEvent<HTMLElement>) => {
    setPopupAnchor(e.currentTarget);
  }, []);

  const onMouseOut = React.useCallback(() => {
    setPopupAnchor(null);
  }, []);

  return (
    <div onMouseOver={onMouseOver} onMouseOut={onMouseOut}>
      <Badge
        badgeContent={quantity > 1 ? quantity : 0}
        color="primary"
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <img
          src={iconUrl}
          alt={label}
          style={{ width: "40px", height: "40px" }}
        />
      </Badge>
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
