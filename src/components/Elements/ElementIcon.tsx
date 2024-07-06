import React from "react";

import { Box, SxProps } from "@mui/material";

import { useDIDependency } from "@/container";

import { useObservation } from "@/hooks/use-observation";
import { Null$ } from "@/observables";

import { Compendium, ElementModel } from "@/services/sh-compendium";

import Tooltip from "../Tooltip";
import ElementDetails from "./ElementDetails";

export interface ElementIconBaseProps {
  sx?: SxProps;
  maxWidth?: number;
  maxHeight?: number;
  onClick?(): void;
}
export type ElementIconProps = ElementIconBaseProps &
  (
    | {
        element: ElementModel;
      }
    | {
        elementId: string;
      }
  );

const ElementIcon = ({
  sx,
  maxWidth,
  maxHeight,
  onClick,
  element,
  elementId,
}: ElementIconBaseProps & {
  element?: ElementModel;
  elementId?: string;
}) => {
  const compendium = useDIDependency(Compendium);

  if (!element && elementId) {
    element = compendium.getElementById(elementId);
  }

  const iconUrl = useObservation(element?.iconUrl$ ?? Null$) ?? "";
  const label = useObservation(element?.label$ ?? Null$) ?? "";

  if (!element) {
    return null;
  }

  if (!maxWidth && !maxHeight) {
    maxWidth = 40;
  }

  return (
    <Tooltip title={<ElementDetails element={element} />}>
      <Box
        sx={{
          width: maxWidth ? `${maxWidth}px` : undefined,
          height: maxHeight ? `${maxHeight}px` : undefined,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          cursor: onClick ? "pointer" : undefined,
          ...sx,
        }}
        aria-label={label}
        tabIndex={onClick ? 0 : undefined}
        onClick={onClick}
      >
        <img
          loading="lazy"
          src={iconUrl}
          aria-hidden="true"
          style={{ display: "block", maxWidth: "100%", maxHeight: "100%" }}
        />
      </Box>
    </Tooltip>
  );
};

export default ElementIcon;
