import React from "react";

import { Stack, Typography, Button } from "@mui/material";

import { useDIDependency } from "@/container";

import { SaveManager } from "@/services/sh-game/SaveManager";

import { useObservation } from "@/hooks/use-observation";

const ChooseGamePage = () => {
  const saveManager = useDIDependency(SaveManager);
  const saves = useObservation(saveManager.saves$);

  return (
    <Stack
      direction="column"
      spacing={2}
      alignItems="center"
      justifyContent="center"
      sx={{ p: 2 }}
    >
      <Typography variant="h1">The Hush House Catalogue</Typography>
      {saves && saves.length === 0 && <Typography>No saves found</Typography>}
      <Button onClick={() => saveManager.newGame()}>New Game</Button>
      {/* FIXME: Make a better UI for this*/}
      {/* {saves && saves.length > 0 && (
        <List>
          {saves.map((save, index) => (
            <ListItemButton
              key={index}
              onClick={() => saveManager.loadSave(save.saveName)}
            >
              {save.saveName}
            </ListItemButton>
          ))}
        </List>
      )} */}
    </Stack>
  );
};

export default ChooseGamePage;
