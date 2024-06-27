import React from "react";
import { DateTime } from "luxon";

import { Stack, Typography, Button, Paper, Box, Divider } from "@mui/material";

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
      {saves && saves.length > 0 && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            height: "100%",
            overflow: "auto",
            // Enough room for 4 items max plus gap.
            maxWidth: 350 * 4 + 16 * 3,
          }}
          // Equivalent to gap={3}
          gap="16px"
        >
          {saves.map(({ saveName, saveDate }, index) => (
            <Paper key={index} sx={{ width: 350, px: 2, pt: 2 }}>
              <Typography
                variant="h4"
                textAlign="center"
                textOverflow="ellipsis"
                overflow="hidden"
                noWrap
              >
                {saveName.toUpperCase()}
              </Typography>
              <Typography variant="body1" textAlign="center">
                {DateTime.fromISO(saveDate)
                  .toLocal()
                  .toLocaleString(DateTime.DATETIME_MED)}
              </Typography>
              <Divider sx={{ mt: 1 }} orientation="horizontal" />
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  width: "100%",
                }}
              >
                <Button disabled>Delete</Button>
                <Button
                  sx={{ ml: "auto" }}
                  onClick={() => saveManager.loadSave(saveName)}
                >
                  Load
                </Button>
              </Box>
            </Paper>
          ))}
        </Box>
      )}
    </Stack>
  );
};

export default ChooseGamePage;
