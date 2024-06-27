import React from "react";

import {
  Divider,
  IconButton,
  List,
  ListItemButton,
  Popover,
} from "@mui/material";

import { Menu } from "@mui/icons-material";

import { useDIDependency } from "@/container";

import { SaveManager } from "@/services/sh-game/SaveManager";

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
  return (
    <Popover open={anchorEl != null} anchorEl={anchorEl} onClose={onClose}>
      <List sx={{ width: 200 }}>
        <ListItemButton onClick={() => saveManager.autosave()}>
          Save
        </ListItemButton>
        <ListItemButton disabled>Save As</ListItemButton>
        <Divider />
        <ListItemButton disabled>Load</ListItemButton>
      </List>
    </Popover>
  );
};
