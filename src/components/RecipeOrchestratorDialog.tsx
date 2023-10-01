import * as React from "react";
import { mapValues } from "lodash";

import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogTitle";
import DialogTitle from "@mui/material/DialogTitle";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";

import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";

import { useDIDependency } from "@/container";
import { Null$, observableObjectOrEmpty, useObservation } from "@/observables";

import {
  OrchestrationSlot,
  Orchestrator,
  isVariableSituationOrchestration,
} from "@/services/sh-game/orchestration";

import SituationSelectField from "./SituationSelectField";
import AspectsList from "./AspectsList";
import ElementStackSelectField from "./ElementStackSelectField";
import AspectIcon from "./AspectIcon";
import PinRecipeIconButton from "./PinRecipeIconButton";

const RecipeOrchestratorDialog = () => {
  const orchestrator = useDIDependency(Orchestrator);

  const orchestration = useObservation(orchestrator.orchestration$);
  const aspectRequirements =
    useObservation(orchestrator.aspectRequirements$) ?? {};
  const canExecute = useObservation(orchestrator.canExecute$) ?? false;

  const recipe = useObservation(orchestration?.recipe$ ?? Null$);
  const recipeLabel = useObservation(recipe?.label$ ?? Null$);
  const situation = useObservation(orchestration?.situation$ ?? Null$);
  const situationLabel = useObservation(situation?.label$ ?? Null$);

  const slots =
    useObservation(observableObjectOrEmpty(orchestration?.slots$)) ?? {};

  if (!orchestration) {
    return null;
  }

  let label = recipeLabel ?? situationLabel;
  if (label === ".") {
    label = situationLabel;
  }

  return (
    <Dialog open onClose={() => orchestrator.cancel()} fullWidth maxWidth="md">
      <DialogTitle sx={{ display: "flex", flexDirection: "row" }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Box sx={{ display: "flex", flexDirection: "row" }}>
            <Typography variant="h5" sx={{ mr: 2 }}>
              {/* Recipe labels in situations are always written as upper case in-game, and the game isn't careful when casing its titles. */}
              {label?.toLocaleUpperCase()}
            </Typography>
            {recipe && (
              <PinRecipeIconButton
                sx={{ mt: "-4px" }}
                recipeId={recipe.recipeId}
              />
            )}
          </Box>
          <AspectsList
            aspects={mapValues(
              aspectRequirements,
              (value) => `${value.current} / ${value.required}`
            )}
            iconSize={30}
          />
        </Box>
        <IconButton
          sx={{ ml: "auto", alignSelf: "flex-start" }}
          onClick={() => orchestrator.cancel()}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
          height: 460,
        }}
      >
        {isVariableSituationOrchestration(orchestration) ? (
          <SituationSelectField
            label="Workstation"
            fullWidth
            requireUnstarted
            situations$={orchestration.availableSituations$}
            value={situation ?? null}
            onChange={(s) => orchestration.selectSituation(s)}
          />
        ) : (
          <TextField
            label="Workstation"
            fullWidth
            value={situationLabel ?? ""}
          />
        )}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            rowGap: 2,
            columnGap: 3,
            overflow: "auto",
          }}
        >
          {Object.keys(slots).map((slotId) => (
            <SlotEditor
              key={slotId}
              slot={slots[slotId]}
              recipeRequiredAspects={Object.keys(aspectRequirements)}
            />
          ))}
        </Box>
      </DialogContent>
      <DialogActions sx={{ display: "flex", flexDirection: "row" }}>
        <Button sx={{ mr: "auto" }} onClick={() => orchestrator.cancel()}>
          Cancel
        </Button>
        <ButtonGroup>
          <Button onClick={() => orchestrator.apply()}>Prepare Recipe</Button>
          <Button disabled={!canExecute} onClick={() => orchestrator.execute()}>
            Start Recipe
          </Button>
        </ButtonGroup>
      </DialogActions>
    </Dialog>
  );
};

interface SlotEditorProps {
  slot: OrchestrationSlot;
  recipeRequiredAspects: readonly string[];
}

const SlotEditor = ({ slot, recipeRequiredAspects }: SlotEditorProps) => {
  const assignment = useObservation(slot.assignment$) ?? null;

  // Remove the power aspects from these since that will be displayed by the workstation hints.
  const requiredAspects = Object.keys(slot.spec.required);
  const essentialAspects = Object.keys(slot.spec.essential);

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", gap: 1, width: "100%" }}
    >
      <Box
        sx={{ display: "flex", flexDirection: "row", gap: 1, width: "100%" }}
      >
        <Typography variant="body1" sx={{ mr: "auto" }}>
          {slot.spec.label}
        </Typography>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            gap: 1,
            // FIXME: We are getting an aspect that is hidden here... See skill upgrade recipes on consider slot.
            mr: essentialAspects.length > 0 ? 2 : 0,
          }}
        >
          {requiredAspects.map((aspectId) => (
            <AspectIcon key={aspectId} aspectId={aspectId} size={30} />
          ))}
        </Box>
        <Box sx={{ display: "flex", flexDirection: "row", gap: 1 }}>
          {essentialAspects.map((aspectId) => (
            <AspectIcon key={aspectId} aspectId={aspectId} size={30} />
          ))}
        </Box>
      </Box>
      <ElementStackSelectField
        label="Element"
        fullWidth
        elementStacks$={slot.availableElementStacks$}
        displayAspects={recipeRequiredAspects}
        value={assignment}
        onChange={(stack) => slot.assign(stack)}
      />
    </Box>
  );
};

export default RecipeOrchestratorDialog;
