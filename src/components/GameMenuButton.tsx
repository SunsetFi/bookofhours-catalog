import React from "react";

import {
  Divider,
  IconButton,
  List,
  ListItemButton,
  Popover,
  Stack,
  Typography,
} from "@mui/material";

import { Menu } from "@mui/icons-material";

import { useDIDependency } from "@/container";

import { SaveManager } from "@/services/sh-game/SaveManager/SaveManager";

import { useObservation } from "@/hooks/use-observation";
import { DateTime } from "luxon";
import { SettingsManager } from "@/services/settings";

const GameMenuButton = () => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

  return (
    <>
      <IconButton
        aria-label="Game Menu"
        onClick={(e) => setAnchorEl(e.currentTarget)}
      >
        <Menu />
      </IconButton>
      <GameMenu anchorEl={anchorEl} onClose={() => setAnchorEl(null)} />
    </>
  );
};
export default GameMenuButton;

interface GameMenuProps {
  anchorEl: HTMLElement | null;
  onClose(): void;
}
const GameMenu = ({ anchorEl, onClose }: GameMenuProps) => {
  const saveManager = useDIDependency(SaveManager);
  const settingsManager = useDIDependency(SettingsManager);
  const canSave = useObservation(saveManager.canSave$);
  const autosave = useObservation(saveManager.autosave$);

  const onAutosave = React.useCallback(() => {
    saveManager.autosave();
    onClose();
  }, [saveManager, onClose]);

  const onSaveAs = React.useCallback(() => {
    saveManager.showSaveGameDialog();
    onClose();
  }, [saveManager, onClose]);

  const onLoadAutosave = React.useCallback(() => {
    saveManager.loadSave("AUTOSAVE");
    onClose();
  }, [saveManager, onClose]);

  const onLoad = React.useCallback(() => {
    saveManager.openLoadGameDialog();
    onClose();
  }, [saveManager, onClose]);

  const onNewGame = React.useCallback(() => {
    saveManager.newGame();
    onClose();
  }, [saveManager, onClose]);

  const onSettings = React.useCallback(() => {
    settingsManager.openSettingsDialog();
    onClose();
  }, [settingsManager, onClose]);

  return (
    <Popover open={anchorEl != null} anchorEl={anchorEl} onClose={onClose}>
      <List sx={{ width: 250 }}>
        <ListItemButton disabled={!canSave} onClick={onSaveAs}>
          Save Game
        </ListItemButton>
        <ListItemButton onClick={onLoad}>Load Game</ListItemButton>
        <Divider />
        <ListItemButton disabled={!canSave} onClick={onAutosave}>
          Save as Autosave
        </ListItemButton>
        <ListItemButton disabled={autosave === null} onClick={onLoadAutosave}>
          <Stack direction="column">
            <Typography variant="body2">Load Last Autosave</Typography>
            {autosave && (
              <Typography variant="caption">
                {DateTime.fromISO(autosave.saveDate).toLocaleString(
                  DateTime.DATETIME_SHORT
                )}
              </Typography>
            )}
          </Stack>
        </ListItemButton>
        <Divider />
        <ListItemButton onClick={onNewGame}>New Game</ListItemButton>
        <Divider />
        <ListItemButton onClick={onSettings}>Settings</ListItemButton>
      </List>
    </Popover>
  );
};
