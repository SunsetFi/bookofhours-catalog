import * as React from "react";

import {
  Dialog,
  DialogTitle,
  DialogActions,
  Typography,
  Box,
  Button,
  ButtonGroup,
  IconButton,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";

import { useDIDependency } from "@/container";
import { Null$ } from "@/observables";

import {
  Orchestration,
  Orchestrator,
  isCompletedOrchestration,
  isExecutableOrchestration,
  isVariableSituationOrchestration,
  isOngoingOrchestration,
} from "@/services/sh-game/orchestration";

import { useObservation } from "@/hooks/use-observation";

import SituationSelectField from "../SituationSelectField";

import OrchestrationSidebar from "./OrchestrationSidebar";
import OrchestrationSlots from "./OrchestrationSlots";
import OrchestrationOutput from "./OrchestrationOutput";

const RecipeOrchestratorDialog = () => {
  const orchestrator = useDIDependency(Orchestrator);

  const orchestration = useObservation(orchestrator.orchestration$);

  if (!orchestration) {
    return null;
  }

  return (
    <Dialog open onClose={() => orchestrator.close()} fullWidth maxWidth="lg">
      <RecipeOrchestrationDialogContent orchestration={orchestration} />
    </Dialog>
  );
};

interface RecipeOrchestrationDialogContentProps {
  orchestration: Orchestration;
}

const RecipeOrchestrationDialogContent = ({
  orchestration,
}: RecipeOrchestrationDialogContentProps) => {
  const orchestrator = useDIDependency(Orchestrator);

  const recipe = useObservation(orchestration?.recipe$ ?? Null$);
  const recipeLabel = useObservation(recipe?.label$ ?? Null$);

  const situation = useObservation(orchestration?.situation$ ?? Null$);
  const situationLabel = useObservation(situation?.label$ ?? Null$);

  const timeRemaining = useObservation(
    () =>
      isOngoingOrchestration(orchestration)
        ? orchestration.timeRemaining$
        : Null$,
    [orchestration]
  );

  const canExecute =
    useObservation(
      () =>
        isExecutableOrchestration(orchestration)
          ? orchestration.canExecute$
          : Null$,
      [orchestration]
    ) ?? false;

  let label = recipeLabel ?? situationLabel;
  if (label === ".") {
    label = situationLabel;
  }

  const titles: string[] = [];

  if (label) {
    // Recipe labels in situations are always written as upper case in-game, and the game isn't careful when casing its titles.
    titles.push(label.toLocaleUpperCase());
  }

  if (situationLabel && situationLabel !== situation?.verbId) {
    // Some verbs, notably arrival verbs like oriflamme's, have no labels.
    titles.push(situationLabel);
  }

  if (isOngoingOrchestration(orchestration)) {
    titles.push((timeRemaining?.toFixed(1) ?? "0.0") + "s");
  }

  if (isCompletedOrchestration(orchestration)) {
    titles.push("Recipe Completed");
  }

  return (
    <>
      <DialogTitle
        component="div"
        sx={{
          display: "flex",
          flexDirection: "row",
          gap: 2,
          alignItems: "baseline",
        }}
      >
        {titles.map((title, i) => (
          <>
            {i !== 0 && " - "}
            <Typography key={i} variant="h6">
              {title}
            </Typography>
          </>
        ))}
        <IconButton
          sx={{ ml: "auto", alignSelf: "flex-start" }}
          onClick={() => orchestrator.close()}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          height: "100%",
          px: 3,
          pb: 1,
          gap: 1,
        }}
      >
        <OrchestrationSidebar
          sx={{ height: 460, mr: 2 }}
          orchestration={orchestration}
        />
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 3,
            height: 460,
            width: "100%",
            minWidth: 0,
          }}
        >
          {isVariableSituationOrchestration(orchestration) && (
            <SituationSelectField
              label="Workstation"
              fullWidth
              requireUnstarted
              situations$={orchestration.availableSituations$}
              value={situation ?? null}
              onChange={(s) => orchestration.selectSituation(s)}
            />
          )}
          {!isCompletedOrchestration(orchestration) && (
            <OrchestrationSlots orchestration={orchestration} />
          )}
          {isCompletedOrchestration(orchestration) && (
            <OrchestrationOutput orchestration={orchestration} />
          )}
        </Box>
      </Box>
      <DialogActions sx={{ display: "flex", flexDirection: "row" }}>
        <Button sx={{ mr: "auto" }} onClick={() => orchestrator.close()}>
          Close
        </Button>
        <ButtonGroup>
          {isExecutableOrchestration(orchestration) && (
            <>
              <Button onClick={() => orchestration.prepare()}>
                Prepare Recipe
              </Button>
              <Button
                disabled={!canExecute}
                onClick={() => orchestration.execute()}
              >
                Start Recipe
              </Button>
            </>
          )}
          {isOngoingOrchestration(orchestration) && (
            <Button onClick={() => orchestration.passTime()}>Pass Time</Button>
          )}
          {isCompletedOrchestration(orchestration) && (
            <Button onClick={() => orchestration.conclude()}>Conclude</Button>
          )}
        </ButtonGroup>
      </DialogActions>
    </>
  );
};

export default RecipeOrchestratorDialog;
