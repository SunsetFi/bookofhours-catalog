import React from "react";

import { IconButton, SxProps } from "@mui/material";
import { PushPin } from "@mui/icons-material";

import { useObservation } from "@/hooks/use-observation";
import { useDIDependency } from "@/container";

import { Pinboard } from "@/services/pins/Pinboard";
import { useRecipe } from "@/services/sh-compendium";

export interface PinElementIconButtonProps {
  sx?: SxProps;
  recipeId: string;
}
const PinRecipeIconButton = ({ sx, recipeId }: PinElementIconButtonProps) => {
  const recipe = useRecipe(recipeId);
  const pinboard = useDIDependency(Pinboard);

  const recipeLabel = useObservation(recipe.label$);

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

  if (!recipeLabel) {
    return null;
  }

  return (
    <IconButton
      sx={sx}
      role="button"
      aria-pressed={isRecipePinned ? "true" : "false"}
      title={`Pin recipe ${recipeLabel}`}
      onClick={onClick}
    >
      <PushPin
        sx={{ transform: isRecipePinned ? "rotate(-90deg)" : "rotate(0deg)" }}
      />
    </IconButton>
  );
};

export default PinRecipeIconButton;
