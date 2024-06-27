import React from "react";
import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";

import { ComponentDialogRequestProps } from "@/services/dialog";

import SelectGameContent from "@/components/LoadGameContent";

const NewGameDialogContent = ({ model }: ComponentDialogRequestProps) => {
  return (
    <>
      <DialogTitle>
        <Typography variant="h3">Load a Game</Typography>
      </DialogTitle>
      <DialogContent>
        <SelectGameContent />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => model.resolve(null)}>Cancel</Button>
      </DialogActions>
    </>
  );
};

export default NewGameDialogContent;
