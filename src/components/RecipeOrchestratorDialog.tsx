import * as React from "react";

import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogTitle";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";

import { useDIDependency } from "@/container";
import { useObservation } from "@/observables";

import { RecipeOrchestrator } from "@/services/sh-game/RecipeOrchestrator";

export const RecipeOrchestratorDialog = () => {
  const orchestrator = useDIDependency(RecipeOrchestrator);
  const isOrchestrating = useObservation(orchestrator.isOrchestrating$);

  if (!isOrchestrating) {
    return null;
  }

  return (
    <Dialog open={true} onClose={() => orchestrator.cancel()}>
      <DialogTitle>Recipe Executor</DialogTitle>
      <DialogContent></DialogContent>
    </Dialog>
  );
};
