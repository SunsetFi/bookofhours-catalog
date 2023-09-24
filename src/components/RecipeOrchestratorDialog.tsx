import * as React from "react";

import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogTitle";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";

import { useDIDependency } from "@/container";
import { useObservation } from "@/observables";

import { Orchestrator } from "@/services/sh-game/orchestration";

export const RecipeOrchestratorDialog = () => {
  const orchestrator = useDIDependency(Orchestrator);
  const orchestration = useObservation(orchestrator.orchestration$);

  if (!orchestration) {
    return null;
  }

  return (
    <Dialog open={true} onClose={() => orchestrator.cancel()}>
      <DialogTitle>Recipe Executor</DialogTitle>
      <DialogContent></DialogContent>
    </Dialog>
  );
};
