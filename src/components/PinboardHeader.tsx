import * as React from "react";

import type { SxProps } from "@mui/material/styles";
import Box from "@mui/material/Box";

import { useObservation } from "@/observables";

import { useDIDependency } from "@/container";

import { Pinboard } from "@/services/sh-pins/Pinboard";
import {
  PinnedElementItemModel,
  PinnedItemModel,
  isPinnedElementItemModel,
} from "@/services/sh-pins/PinnedItemModel";

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
        <PinnedItemModelIcon key={i} model={pin} />
      ))}
    </Box>
  );
};

export default PinboardHeader;

interface PinnedItemModelIconProps {
  model: PinnedItemModel;
}

const PinnedItemModelIcon = ({ model }: PinnedItemModelIconProps) => {
  if (isPinnedElementItemModel(model)) {
    return <PinnedElementItemHeaderIcon model={model} />;
  }

  return null;
};

interface PinnedElementItemHeaderIconProps {
  model: PinnedElementItemModel;
}

const PinnedElementItemHeaderIcon = ({
  model,
}: PinnedElementItemHeaderIconProps) => {
  const element = useObservation(model.element$);

  if (!element) {
    return null;
  }

  return <ElementIcon element={element} />;
};
