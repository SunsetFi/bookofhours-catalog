import * as React from "react";

import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";

import { Null$ } from "@/observables";

import { useDIDependency } from "@/container";

import { TerrainUnlocker } from "@/services/sh-game";

import { useObservation } from "@/hooks/use-observation";

import ElementStackSelectField from "./ElementStackSelectField";

const UnlockTerrainDialog = () => {
  const unlocker = useDIDependency(TerrainUnlocker);

  const target = useObservation(unlocker.target$);
  const targetLabel = useObservation(target?.label$ ?? Null$);
  const targetDescription = useObservation(target?.description$ ?? Null$);
  const unlocking = useObservation(unlocker.unlockingTerrainId$);

  const selectedStack = useObservation(unlocker.selectedStack$) ?? null;

  if (!target || !targetLabel) {
    return null;
  }

  return (
    <Dialog open onClose={() => unlocker.close()}>
      <DialogTitle sx={{ display: "flex", flexDirection: "row" }}>
        <span>Unlock {targetLabel}</span>
        <IconButton
          sx={{ ml: "auto", alignSelf: "flex-start" }}
          onClick={() => unlocker.close()}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {unlocking && (
          <Typography variant="body1" color="error">
            Only one terrain can be unlocked at a time
          </Typography>
        )}
        {!unlocking && (
          <>
            <Typography variant="body1" sx={{ textAlign: "center", mb: 1 }}>
              {targetDescription}
            </Typography>
            <ElementStackSelectField
              elementStacks$={unlocker.unlockCandidateStacks$}
              label="Unlock with"
              value={selectedStack}
              onChange={(stack) => unlocker.selectStack(stack)}
            />
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ display: "flex", flexDirection: "row" }}>
        <Button sx={{ mr: "auto" }} onClick={() => unlocker.close()}>
          Cancel
        </Button>
        <Button
          onClick={() => unlocker.execute()}
          disabled={selectedStack == null}
        >
          Unlock
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UnlockTerrainDialog;
