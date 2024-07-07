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
      {/*
      Per NVDA discussions, we need a document inside the dialog to pick this up as a browsable document object
      Otherwise, NVDA treats this as a typical notification+options dialog, as you would see in traditional win32 applications.
      Its worth noting that NVDA said they would change this years ago, but never have.
      See https://github.com/nvaccess/nvda/issues/4493
      */}
      <DialogContent role="document">
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
