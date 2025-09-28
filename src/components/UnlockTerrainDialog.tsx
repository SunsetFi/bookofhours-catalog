import React from "react";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  IconButton,
  Stack,
  Box,
} from "@mui/material";

import { Close as CloseIcon } from "@mui/icons-material";

import { Null$ } from "@/observables";

import { useDIDependency } from "@/container";

import { TerrainUnlocker } from "@/services/sh-game";

import { useObservation } from "@/hooks/use-observation";

import ElementStackSelectField from "./Elements/ElementStackSelectField";
import AspectIcon from "./Aspects/AspectIcon";

const UnlockTerrainDialog = () => {
  const unlocker = useDIDependency(TerrainUnlocker);

  const target = useObservation(unlocker.target$);
  const targetLabel = useObservation(target?.label$ ?? Null$);
  const targetDescription = useObservation(target?.description$ ?? Null$);
  const unlocking = useObservation(unlocker.unlockingTerrainId$);

  const requiredAspectsMap = useObservation(unlocker.unlockRequirements$);
  const essentialAspectsMap = useObservation(unlocker.unlockEssentials$);

  const requiredAspects = Object.keys(requiredAspectsMap ?? {});
  const essentialAspects = Object.keys(essentialAspectsMap ?? {});

  const selectedStack = useObservation(unlocker.selectedStack$) ?? null;

  if (!target || !targetLabel) {
    return null;
  }

  return (
    <Dialog
      open
      slotProps={{
        paper: {
          "aria-modal": "true",
          role: "document",
        },
      }}
      aria-labelledby="dialog-title"
      onClose={() => unlocker.close()}
    >
      <DialogTitle
        id="dialog-title"
        sx={{ display: "flex", flexDirection: "row" }}
      >
        <span>Unlock {targetLabel}</span>
        <IconButton
          sx={{ ml: "auto", alignSelf: "flex-start" }}
          onClick={() => unlocker.close()}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent id="dialog-content">
        {unlocking && (
          <Typography variant="body1" color="error">
            Only one terrain can be unlocked at a time
          </Typography>
        )}
        {!unlocking && (
          <>
            <Typography variant="body1" sx={{ textAlign: "center", mb: 2 }}>
              {targetDescription}
            </Typography>
            <ElementStackSelectField
              elementStacks$={unlocker.unlockCandidateStacks$}
              label="Unlock with"
              helperText={
                <Stack direction="column" gap={1}>
                  {requiredAspects.length > 0 && (
                    <Stack direction="row" gap={1}>
                      <Typography sx={{ mr: "auto" }}>Requires</Typography>
                      {requiredAspects.map((aspectId) => (
                        <AspectIcon
                          key={aspectId}
                          aspectId={aspectId}
                          size={30}
                        />
                      ))}
                    </Stack>
                  )}
                  {essentialAspects.length > 0 && (
                    <Stack direction="row" gap={1}>
                      <Typography sx={{ mr: "auto" }}>Essential</Typography>
                      {essentialAspects.map((aspectId) => (
                        <AspectIcon
                          key={aspectId}
                          aspectId={aspectId}
                          size={30}
                        />
                      ))}
                    </Stack>
                  )}
                </Stack>
              }
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
