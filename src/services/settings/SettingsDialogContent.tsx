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

import { SettingsManager, useSetting } from "@/services/settings";

const SettingsDialogContent = () => {
  const settingsManager = useDIDependency(SettingsManager);
  const interactivity = useSetting("interactivity");
  const enableWisdomEditing = useSetting("enableWisdomEditing");

  return (
    <>
      <DialogTitle>Settings</DialogTitle>
      <DialogContent role="document" sx={{ width: "600px", height: "425px" }}>
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
            <>
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
                      Allows the remote control of verbs and workstations and
                      the ability to pass time, but provides no assistance with
                      recipes and card selection.
                    </FormHelperText>
                  </FormControl>
                  <FormControl>
                    <FormControlLabel
                      value="full"
                      control={<Radio />}
                      label="Full"
                    />
                    <FormHelperText>
                      Provides additional features such as guided crafting
                      recipe execution and automatic card selection for known
                      recipes.
                    </FormHelperText>
                  </FormControl>
                </RadioGroup>
              </FormControl>
              <FormControl>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={enableWisdomEditing}
                      onChange={(e) =>
                        settingsManager.set(
                          "enableWisdomEditing",
                          e.target.checked
                        )
                      }
                    />
                  }
                  label="[ALPHA] Enable Wisdom Tree Interactions"
                />
                <FormHelperText>
                  DANGER: Remote control of the Wisdom Tree is unstable and is
                  in a prototype phase. Game corruptions may arise from use.
                  Usage of this feature is not recommended.
                </FormHelperText>
              </FormControl>
            </>
          )}
        </FormGroup>
      </DialogContent>
    </>
  );
};

export default SettingsDialogContent;
