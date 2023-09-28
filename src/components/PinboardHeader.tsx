import * as React from "react";
import { mapValues } from "lodash";

import type { SxProps } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import { useObservation, mergeMapIfNotNull } from "@/observables";

import { useDIDependency } from "@/container";

import { Pinboard } from "@/services/sh-pins/Pinboard";
import {
  PinnedElementItemModel,
  PinnedItemModel,
  isPinnedElementItemModel,
} from "@/services/sh-pins/PinnedItemModel";

import ElementIcon from "./ElementIcon";
import AspectsList from "./AspectsList";
import CraftIconButton from "./CraftIconButton";
import { Typography } from "@mui/material";

export interface PinboardHeaderProps {
  sx?: SxProps;
}

const PinboardHeader = ({ sx }: PinboardHeaderProps) => {
  const pinboard = useDIDependency(Pinboard);
  const recipeLabel = useObservation(() =>
    pinboard.pinnedRecipe$.pipe(mergeMapIfNotNull((r) => r.label$))
  );
  const pins = useObservation(pinboard.pins$) ?? [];
  const aspects = useObservation(pinboard.pinnedAspects$) ?? {};

  const hasRecipe = recipeLabel !== null;
  const hasPins = pins.length > 0;
  const hasAspects = Object.keys(aspects).length > 0;
  if (!hasPins && !hasAspects) {
    return null;
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        gap: 1,
        height: "100%",
        alignItems: "center",
        ...sx,
      }}
    >
      {recipeLabel && (
        <>
          <Typography variant="body2">{recipeLabel}</Typography>
          {(hasPins || hasAspects) && (
            <Divider orientation="vertical" sx={{ my: 2 }} />
          )}
        </>
      )}
      {hasPins && (
        <>
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              gap: 1,
              height: "100%",
              justifyContent: "center",
            }}
          >
            {pins.map((pin, i) => (
              <PinnedItemModelIcon key={i} model={pin} />
            ))}
          </Box>
          {hasAspects && <Divider orientation="vertical" sx={{ my: 2 }} />}
        </>
      )}
      <AspectsList
        sx={{ justifyContent: "center" }}
        aspects={mapValues(aspects, (value) =>
          value.desired > 0
            ? `${value.current} / ${value.desired}`
            : value.current
        )}
        iconSize={30}
      />
      <Box sx={{ display: "flex", flexDirection: "row" }}>
        <CraftIconButton />
        <IconButton>
          <ExpandMoreIcon />
        </IconButton>
      </Box>
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
