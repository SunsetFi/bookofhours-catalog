import React from "react";

import {
  Autocomplete,
  Button,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  ListItem,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { SaveInfo } from "secrethistories-api";
import { DateTime } from "luxon";

import { useDIDependency } from "@/container";

import { ComponentDialogProps } from "@/services/dialog";

import { useObservation } from "@/hooks/use-observation";

import { SaveManager } from "./SaveManager";

const SaveGameDialogContent = ({ model }: ComponentDialogProps) => {
  const saveManager = useDIDependency(SaveManager);
  const saves = useObservation(saveManager.saves$) ?? [];

  const [selectedSave, setSelectedSave] = React.useState<
    SaveInfo | string | null
  >(null);

  const onSave = React.useCallback(async () => {
    if (selectedSave === null) {
      return;
    }

    const name =
      typeof selectedSave === "string" ? selectedSave : selectedSave.saveName;
    model.resolve(name);
  }, [selectedSave]);

  return (
    <>
      <DialogTitle>
        <Typography variant="h3">Save the Game</Typography>
      </DialogTitle>
      <DialogContent>
        <Stack direction="column" spacing={2} sx={{ mt: 2, width: 450 }}>
          <Autocomplete
            fullWidth
            freeSolo
            options={saves}
            autoHighlight
            getOptionLabel={(option) =>
              typeof option === "string" ? option : option.saveName
            }
            value={selectedSave}
            // We want the live input to still count.
            // Without this, the user has to hit enter to confirm a free text selection.
            onInputChange={(_, value) => setSelectedSave(value)}
            onChange={(_, value) => setSelectedSave(value)}
            renderInput={(params) => (
              <TextField {...params} label="Save Name" />
            )}
            renderOption={(props, save) => (
              <SaveGameOption props={props} save={save} />
            )}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => model.resolve(null)}>Close</Button>
        <Button disabled={selectedSave == null} onClick={onSave}>
          Save
        </Button>
      </DialogActions>
    </>
  );
};

export default SaveGameDialogContent;

interface SaveGameOptionProps {
  props: any;
  save: SaveInfo | string;
}

const SaveGameOption = ({ props, save }: SaveGameOptionProps) => {
  return (
    <ListItem {...props}>
      <ListItemText
        primary={typeof save === "string" ? save : save.saveName}
        secondary={
          typeof save === "string"
            ? "New Save"
            : `Last saved on ${DateTime.fromISO(save.saveDate)
                .toLocal()
                .toLocaleString(DateTime.DATETIME_MED)}`
        }
      />
    </ListItem>
  );
};
