import React from "react";
import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";

import { useDIDependency } from "@/container";

import { ComponentDialogProps } from "@/services/dialog";

import SavedGamesGrid from "@/components/SavedGamesGrid";

import { SaveManager } from "./SaveManager";

const NewGameDialogContent = ({ model }: ComponentDialogProps) => {
  const saveManager = useDIDependency(SaveManager);
  return (
    <>
      <DialogTitle>
        <Typography variant="h3">Load a Game</Typography>
      </DialogTitle>
      <DialogContent>
        <SavedGamesGrid onLoad={(saveName) => model.resolve(saveName)} />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => model.resolve(null)}>Cancel</Button>
      </DialogActions>
    </>
  );
};

export default NewGameDialogContent;
