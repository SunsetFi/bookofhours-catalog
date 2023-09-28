import * as React from "react";

import Popper from "@mui/material/Popper";
import type { Instance as PopperInstance } from "@popperjs/core";

import { useDIDependency } from "@/container";

import { Null$, useObservation } from "@/observables";

import { useMutationObserver } from "@/hooks/use-mutation-observer";

import { Compendium, ElementModel } from "@/services/sh-compendium";

import ElementDetails from "./ElementDetails";

export type ElementIconProps = {
  title?: string;
  width?: number;
} & (
  | {
      element: ElementModel;
    }
  | {
      elementId: string;
    }
);

const ElementIcon = ({
  title,
  width,
  element,
  elementId,
}: {
  width?: number;
  title?: string;
  element?: ElementModel;
  elementId?: string;
}) => {
  const compendium = useDIDependency(Compendium);

  const popperRef = React.useRef<PopperInstance>(null);
  const [elementDetailsRef, setElementDetailsRef] =
    React.useState<HTMLDivElement | null>(null);

  const [popupAnchor, setPopupAnchor] = React.useState<HTMLElement | null>(
    null
  );

  if (!element && elementId) {
    element = compendium.getElementById(elementId);
  }

  const iconUrl = element?.iconUrl;
  const label = useObservation(element?.label$ ?? Null$) ?? "";

  const onMouseOver = React.useCallback((e: React.MouseEvent<HTMLElement>) => {
    // FIXME: Popper is appearing off screen, despite the preventOverflow, and jumps back on screen if the screen is scrolled.
    setPopupAnchor(e.currentTarget);
  }, []);

  const onMouseOut = React.useCallback(() => {
    setPopupAnchor(null);
  }, []);

  useMutationObserver(elementDetailsRef, () => {
    if (popperRef.current == null) {
      return;
    }

    popperRef.current.update();
  });

  if (!element) {
    return null;
  }

  return (
    <div onMouseOver={onMouseOver} onMouseOut={onMouseOut}>
      <img
        src={iconUrl}
        alt={label}
        title={title}
        style={{ maxWidth: `${width ?? 40}px` }}
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
