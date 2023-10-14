import * as React from "react";
import { mapValues } from "lodash";

import type { SxProps } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";

import { useObservation } from "@/hooks/use-observation";
import { mergeMapIfNotNull } from "@/observables";

import { useDIDependency } from "@/container";

import { Pinboard } from "@/services/pins/Pinboard";
import {
  PinnedElementItemModel,
  PinnedItemModel,
  isPinnedElementItemModel,
} from "@/services/pins/PinnedItemModel";

import ElementIcon from "./ElementIcon";
import AspectsList from "./AspectsList";

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

  const hasPins = pins.length > 0;
  const hasAspects = Object.keys(aspects).length > 0;
  if (!hasPins && !hasAspects) {
    return null;
  }

  return (
    <Box
      role="region"
      aria-label="Pinboard"
      sx={{
        display: "flex",
        flexDirection: "row",
        gap: 1,
        height: "100%",
        alignItems: "center",
        ...sx,
      }}
    >
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
          {(hasAspects || recipeLabel) && (
            <Divider orientation="vertical" sx={{ my: 2 }} />
          )}
        </>
      )}
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        {recipeLabel && (
          <Typography variant="caption">{recipeLabel}</Typography>
        )}
        <Box
          sx={{ display: "flex", flexDirection: "row", alignItems: "center" }}
        >
          <AspectsList
            sx={{ justifyContent: "center" }}
            aspects={mapValues(aspects, (value) =>
              value.desired > 0
                ? `${value.current} / ${value.desired}`
                : value.current
            )}
            iconSize={30}
          />
        </Box>
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

  return <ElementIcon element={element} onClick={() => model.remove()} />;
};
