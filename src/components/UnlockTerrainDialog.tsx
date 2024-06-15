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
            <Typography variant="body1" sx={{ textAlign: "center", mb: 2 }}>
              {targetDescription}
            </Typography>
            <Stack
              direction="row"
              justifyContent="flex-end"
              gap={1}
              sx={{ width: "100%", mb: 2 }}
            >
              <Stack
                direction="row"
                gap={1}
                sx={{
                  // FIXME: We are getting an aspect that is hidden here... See skill upgrade recipes on consider slot.
                  mr: essentialAspects.length > 0 ? 2 : 0,
                }}
              >
                {requiredAspects.map((aspectId) => (
                  <AspectIcon key={aspectId} aspectId={aspectId} size={30} />
                ))}
              </Stack>
              <Stack direction="row" gap={1}>
                {essentialAspects.map((aspectId) => (
                  <AspectIcon key={aspectId} aspectId={aspectId} size={30} />
                ))}
              </Stack>
            </Stack>
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
