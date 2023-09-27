import * as React from "react";

import type { SxProps } from "@mui/material/styles";
import Box from "@mui/material/Box";

import { Null$, useObservation } from "@/observables";

import { useDIDependency } from "@/container";

import { Pinboard } from "@/services/sh-pins/Pinboard";
import { PinnedItemModel } from "@/services/sh-pins/PinnedItemModel";

import ElementIcon from "./ElementIcon";

export interface PinboardHeaderProps {
  sx?: SxProps;
}

const PinboardHeader = ({ sx }: PinboardHeaderProps) => {
  const pinboard = useDIDependency(Pinboard);
  const pins = useObservation(pinboard.pins$) ?? [];

  return (
    <Box sx={{ display: "flex", flexDirection: "row", gap: 1, ...sx }}>
      {pins.map((pin, i) => (
        <PinboardHeaderIcon key={i} model={pin} />
      ))}
    </Box>
  );
};

export default PinboardHeader;

interface PinboardHeaderIconProps {
  model: PinnedItemModel;
}

const PinboardHeaderIcon = ({ model }: PinboardHeaderIconProps) => {
  const element = useObservation(model.element$);

  if (!element) {
    return null;
  }

  return <ElementIcon element={element} />;
};
