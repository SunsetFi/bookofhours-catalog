import React from "react";

import {
  FormControl,
  Checkbox,
  FormHelperText,
  FormGroup,
  FormLabel,
  RadioGroup,
  Radio,
  DialogContent,
  FormControlLabel,
  DialogTitle,
} from "@mui/material";

import { useDIDependency } from "@/container";

import { useObservation } from "@/hooks/use-observation";

import { SettingsManager } from "@/services/settings";

const SettingsDialogContent = () => {
  const settingsManager = useDIDependency(SettingsManager);
  const interactivity = useObservation(
    () => settingsManager.getObservable("interactivity"),
    [settingsManager]
  );

  return (
    <>
      <DialogTitle>Settings</DialogTitle>
      <DialogContent role="document" sx={{ width: "600px", height: "400px" }}>
        <FormGroup>
          <FormControl sx={{ mb: 1 }}>
            <FormLabel>Interactivity</FormLabel>
            <FormControlLabel
              control={
                <Checkbox
                  aria-describedby="settings-interactivity-description"
                  checked={interactivity !== "read-only"}
                  onChange={(e) =>
                    settingsManager.set(
                      "interactivity",
                      e.target.checked ? "minimal" : "read-only"
                    )
                  }
                />
              }
              label="Enable Interactivity"
            />
            <FormHelperText id="settings-interactivity-description">
              Enables the ability to execute recipes and fast forward time.
            </FormHelperText>
          </FormControl>
          {interactivity !== "read-only" && (
            <FormControl>
              <FormLabel id="setting-interactivity-mode-label">
                Interactivity Level
              </FormLabel>
              <RadioGroup
                aria-labelledby="setting-interactivity-mode-label"
                name="setting-interactivity-mode"
                value={interactivity}
                onChange={(e) =>
                  settingsManager.set("interactivity", e.target.value as any)
                }
              >
                <FormControl>
                  <FormControlLabel
                    value="minimal"
                    control={<Radio />}
                    label="Minimal"
                  />
                  <FormHelperText>
                    Allows the remote controlling of verbs and workstations, but
                    provides no assistance to the card selection.
                  </FormHelperText>
                </FormControl>
                <FormControl>
                  <FormControlLabel
                    value="full"
                    control={<Radio />}
                    label="Full"
                  />
                  <FormHelperText>
                    Provides additional features such as guided crafting recipe
                    execution and automatic card selection for known recipes.
                  </FormHelperText>
                </FormControl>
              </RadioGroup>
            </FormControl>
          )}
        </FormGroup>
      </DialogContent>
    </>
  );
};

export default SettingsDialogContent;
