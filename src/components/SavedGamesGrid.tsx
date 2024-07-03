import React from "react";
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { DateTime } from "luxon";

import { useDIDependency } from "@/container";

import { SaveManager } from "@/services/sh-game/SaveManager/SaveManager";

import { useObservation } from "@/hooks/use-observation";

const ItemWidth = 350;
const GapWidth = 16; // Equivalent to gap={3}
export const SaveGamesGridWidth = ItemWidth * 4 + GapWidth * 3; // Enough room for 4 items max plus gap.

export interface SaveGamesGridProps {
  onLoad(saveName: string): void;
}

const SaveGamesGrid = ({ onLoad }: SaveGamesGridProps) => {
  const saveManager = useDIDependency(SaveManager);
  const saves = useObservation(saveManager.saves$);

  if (!saves) {
    return (
      <Stack
        alignItems="center"
        justifyContent="center"
        sx={{ width: SaveGamesGridWidth }}
      >
        <CircularProgress color="inherit" />
      </Stack>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap",
        gap: `${GapWidth}px`,
        width: SaveGamesGridWidth,
        overflow: "auto",
      }}
    >
      {saves && saves.length === 0 && (
        <Typography justifySelf="center">No saves found</Typography>
      )}
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
            <Button sx={{ ml: "auto" }} onClick={() => onLoad(saveName)}>
              Load
            </Button>
          </Box>
        </Paper>
      ))}
    </Box>
  );
};

export default SaveGamesGrid;
