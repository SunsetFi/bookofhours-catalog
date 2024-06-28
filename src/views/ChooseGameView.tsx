import React from "react";

import { Stack, Typography, Button } from "@mui/material";

import { useDIDependency } from "@/container";

import { SaveManager } from "@/services/sh-game/SaveManager/SaveManager";

import SaveGamesGrid from "@/components/SavedGamesGrid";

const ChooseGamePage = () => {
  const saveManager = useDIDependency(SaveManager);

  return (
    <Stack
      sx={{ width: "100%", height: "100%", pt: 4 }}
      direction="column"
      alignItems="center"
      spacing={2}
    >
      <Typography variant="h1">The Hush House Catalogue</Typography>
      <Button onClick={() => saveManager.newGame()}>New Game</Button>
      <SaveGamesGrid onLoad={(saveName) => saveManager.loadSave(saveName)} />
    </Stack>
  );
};

export default ChooseGamePage;
