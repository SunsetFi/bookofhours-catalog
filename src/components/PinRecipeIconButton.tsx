import * as React from "react";

import IconButton from "@mui/material/IconButton";
import PushPin from "@mui/icons-material/PushPin";
import type { SxProps } from "@mui/material/styles";

import { useObservation } from "@/observables";
import { useDIDependency } from "@/container";

import { Pinboard } from "@/services/pins/Pinboard";

export interface PinElementIconButtonProps {
  sx?: SxProps;
  title?: string;
  recipeId: string;
}
const PinRecipeIconButton = ({
  sx,
  title,
  recipeId,
}: PinElementIconButtonProps) => {
  const pinboard = useDIDependency(Pinboard);

  const pinnedRecipe = useObservation(pinboard.pinnedRecipe$) ?? {
    recipeId: null,
  };

  const isRecipePinned = pinnedRecipe.recipeId === recipeId;

  const onClick = React.useCallback(() => {
    if (isRecipePinned) {
      pinboard.pinRecipe(null);
    } else {
      pinboard.pinRecipe(recipeId);
    }
  }, [isRecipePinned, recipeId]);

  return (
    <IconButton sx={sx} title={title ?? "Pin Recipe"} onClick={onClick}>
      <PushPin
        sx={{ transform: isRecipePinned ? "rotate(-90deg)" : "rotate(0deg)" }}
      />
    </IconButton>
  );
};

export default PinRecipeIconButton;
