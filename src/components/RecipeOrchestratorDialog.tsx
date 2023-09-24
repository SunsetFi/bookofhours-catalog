import * as React from "react";
import { map } from "rxjs";
import { Aspects } from "secrethistories-api";

import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogTitle";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

import { useDIDependency } from "@/container";
import {
  EmptyObject$,
  Null$,
  Observation,
  emptyObjectObservable,
  observeAll,
  useObservation,
} from "@/observables";

import {
  Orchestration,
  Orchestrator,
  isVariableSituationOrchestration,
} from "@/services/sh-game/orchestration";

import SituationSelectField from "./SituationSelectField";
import AspectsList from "./AspectsList";

const RecipeOrchestratorDialog = () => {
  const orchestrator = useDIDependency(Orchestrator);
  const orchestration = useObservation(orchestrator.orchestration$);

  const recipe = useObservation(orchestration?.recipe$ ?? Null$);
  const recipeLabel = useObservation(recipe?.label$ ?? Null$);
  const requirements = useObservation(recipe?.requirements$ ?? Null$) ?? {};
  const situation = useObservation(orchestration?.situation$ ?? Null$);
  const situationLabel = useObservation(situation?.label$ ?? Null$);

  const slots$ =
    orchestration?.slots$ ??
    emptyObjectObservable<Observation<Orchestration["slots$"]>>();

  const slotAspects =
    useObservation(
      () =>
        slots$.pipe(
          map((slots) =>
            Object.values(slots).map(
              (slot) =>
                slot.assignment?.aspects$ ?? emptyObjectObservable<Aspects>()
            )
          ),
          observeAll(),
          map((aspects) => {
            const combined: Aspects = {};
            for (const aspect of aspects) {
              for (const id of Object.keys(aspect)) {
                combined[id] = aspect[id];
              }
            }
            return combined;
          })
        ),
      [slots$]
    ) ?? {};

  const reqsTotaled = React.useMemo(() => {
    const result: Record<string, React.ReactNode> = {};
    for (const req of Object.keys(requirements)) {
      result[req] = (
        <span>
          {slotAspects[req] ?? 0} / {requirements[req]}
        </span>
      );
    }
    return result;
  }, [requirements, slotAspects]);

  if (!orchestration) {
    return null;
  }

  return (
    <Dialog open={true} onClose={() => orchestrator.cancel()}>
      <DialogTitle>Recipe Executor</DialogTitle>
      <DialogContent
        sx={{ width: 480, display: "flex", flexDirection: "column", gap: 2 }}
      >
        {recipeLabel && (
          <Box sx={{ display: "flex", flexDirection: "row", gap: 1 }}>
            <Typography variant="body2" sx={{ mr: 2 }}>
              {recipeLabel}
            </Typography>
            <AspectsList aspects={reqsTotaled} iconSize={30} />
          </Box>
        )}
        {isVariableSituationOrchestration(orchestration) ? (
          <SituationSelectField
            label="Workstation"
            fullWidth
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
      </DialogContent>
    </Dialog>
  );
};

export default RecipeOrchestratorDialog;
