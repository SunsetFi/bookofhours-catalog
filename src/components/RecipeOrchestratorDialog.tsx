import * as React from "react";
import { mapValues } from "lodash";

import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogActions from "@mui/material/DialogActions";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import IconButton from "@mui/material/IconButton";
import { type SxProps } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";

import { useDIDependency } from "@/container";
import { Null$, observableObjectOrEmpty } from "@/observables";

import {
  CompletedOrchestration,
  Orchestration,
  OrchestrationSlot,
  Orchestrator,
  isCompletedOrchestration,
  isExecutableOrchestration,
  isContentContainingOrchestration,
  isVariableSituationOrchestration,
  isOngoingOrchestration,
} from "@/services/sh-game/orchestration";

import { useObservation } from "@/hooks/use-observation";

import SituationSelectField from "./SituationSelectField";
import AspectsList from "./AspectsList";
import ElementStackSelectField from "./ElementStackSelectField";
import AspectIcon from "./AspectIcon";
import TlgNote from "./TlgNote";
import ElementStackTray from "./ElementStackTray";
import GameTypography from "./GameTypography";

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
        {label && (
          <Typography variant="h5">
            {/* Recipe labels in situations are always written as upper case in-game, and the game isn't careful when casing its titles. */}
            {label?.toLocaleUpperCase()}
          </Typography>
        )}
        {!isVariableSituationOrchestration(orchestration) && (
          <>
            {label && " - "}
            <Typography variant="h5">{situationLabel}</Typography>
          </>
        )}
        {isOngoingOrchestration(orchestration) && (
          <>
            {(label || !isVariableSituationOrchestration(orchestration)) &&
              " - "}
            <Typography variant="h5">
              {timeRemaining?.toFixed(1) ?? "0.0"}s
            </Typography>
          </>
        )}
        {isCompletedOrchestration(orchestration) && (
          <>
            {(label || !isVariableSituationOrchestration(orchestration)) &&
              " - "}
            <Typography variant="h5">Recipe Completed</Typography>
          </>
        )}
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
        <OrchestratorSidebar
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
            <OrchestratorSlots orchestration={orchestration} />
          )}
          {isCompletedOrchestration(orchestration) && (
            <OrchestratorOutput orchestration={orchestration} />
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

interface OrchestratorSidebarProps {
  sx?: SxProps;
  orchestration: Orchestration;
}

const OrchestratorSidebar = ({
  sx,
  orchestration,
}: OrchestratorSidebarProps) => {
  const requirements = useObservation(orchestration.requirements$) ?? {};
  const aspects = useObservation(orchestration.aspects$) ?? {};

  const startDescription = useObservation(
    () =>
      isExecutableOrchestration(orchestration)
        ? orchestration.startDescription$
        : Null$,
    [orchestration]
  );

  const notes =
    useObservation(
      () =>
        isContentContainingOrchestration(orchestration)
          ? orchestration.notes$
          : Null$,
      [orchestration]
    ) ?? [];

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        width: 400,
        ...sx,
      }}
    >
      {Object.keys(requirements).length > 0 && (
        <AspectsList
          sx={{ mb: 3 }}
          aspects={mapValues(
            requirements,
            (value, key) => `${aspects[key] ?? 0} / ${value}`
          )}
          iconSize={30}
        />
      )}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
          pr: 1,
          overflow: "auto",
          height: "100%",
        }}
      >
        {startDescription && (
          <GameTypography component="div" variant="body2">
            {startDescription}
          </GameTypography>
        )}
        {notes.map((note, index) => (
          <TlgNote key={index} elementStack={note} />
        ))}
      </Box>
    </Box>
  );
};

interface OrchestratorOutputProps {
  orchestration: CompletedOrchestration;
}

const OrchestratorOutput = ({ orchestration }: OrchestratorOutputProps) => {
  return <ElementStackTray elementStacks$={orchestration.content$} />;
};

interface OrchestratorSlotsProps {
  orchestration: Orchestration;
}

const OrchestratorSlots = ({ orchestration }: OrchestratorSlotsProps) => {
  const requirements = useObservation(orchestration.requirements$) ?? {};
  const slots =
    useObservation(observableObjectOrEmpty(orchestration.slots$)) ?? {};

  return (
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
          recipeRequiredAspects={Object.keys(requirements)}
        />
      ))}
    </Box>
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
        requireExterior
        displayAspects={recipeRequiredAspects}
        value={assignment}
        onChange={(stack) => slot.assign(stack)}
      />
    </Box>
  );
};

export default RecipeOrchestratorDialog;
