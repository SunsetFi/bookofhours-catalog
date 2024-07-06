import React from "react";
import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";

import { ComponentDialogProps } from "@/services/dialog";

import SavedGamesGrid from "@/components/SavedGamesGrid";

const LoadGameDialogContent = ({ model }: ComponentDialogProps) => {
  return (
    <>
      <DialogTitle id="dialog-title" variant="h3">
        Load a Game
      </DialogTitle>
      <DialogContent>
        <SavedGamesGrid
          id="dialog-content"
          autoFocus
          onLoad={(saveName) => model.resolve(saveName)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => model.resolve(null)}>Cancel</Button>
      </DialogActions>
    </>
  );
};

export default LoadGameDialogContent;
