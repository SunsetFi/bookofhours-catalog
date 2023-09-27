import * as React from "react";

import Popper from "@mui/material/Popper";
import type { Instance as PopperInstance } from "@popperjs/core";

import { useObservation } from "@/observables";

import { useMutationObserver } from "@/hooks/use-mutation-observer";

import { ElementModel } from "@/services/sh-compendium";

import ElementDetails from "./ElementDetails";

export interface ElementIconProps {
  element: ElementModel;
}

const ElementIcon = ({ element }: ElementIconProps) => {
  const popperRef = React.useRef<PopperInstance>(null);
  const [elementDetailsRef, setElementDetailsRef] =
    React.useState<HTMLDivElement | null>(null);

  const [popupAnchor, setPopupAnchor] = React.useState<HTMLElement | null>(
    null
  );

  const iconUrl = element.iconUrl;
  const label = useObservation(element.label$) ?? "";

  const onMouseOver = React.useCallback((e: React.MouseEvent<HTMLElement>) => {
    // FIXME: Popper is appearing off screen, despite the preventOverflow, and jumps back on screen if the screen is scrolled.
    setPopupAnchor(e.currentTarget);
  }, []);

  const onMouseOut = React.useCallback(() => {
    setPopupAnchor(null);
  }, []);

  useMutationObserver(elementDetailsRef, () => {
    console.log("Mutation");
    if (popperRef.current == null) {
      return;
    }

    popperRef.current.update();
  });

  return (
    <div onMouseOver={onMouseOver} onMouseOut={onMouseOut}>
      <img
        src={iconUrl}
        alt={label}
        style={{ width: "40px", height: "40px" }}
      />
      <Popper
        popperRef={popperRef}
        open={popupAnchor != null}
        anchorEl={popupAnchor!}
        modifiers={[
          {
            name: "preventOverflow",
            options: {
              mainAxis: true,
              altAxis: true,
              boundariesElement: "viewport",
              padding: 8,
            },
          },
        ]}
        sx={{
          pointerEvents: "none",
        }}
      >
        <ElementDetails ref={setElementDetailsRef} element={element} />
      </Popper>
    </div>
  );
};

export default ElementIcon;
