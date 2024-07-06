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
import { SaveInfo } from "secrethistories-api";

const ItemWidth = 350;
const GapWidth = 16; // Equivalent to gap={3}
export const SaveGamesGridWidth = ItemWidth * 4 + GapWidth * 3; // Enough room for 4 items max plus gap.

export interface SaveGamesGridProps {
  id?: string;
  autoFocus?: boolean;
  onLoad(saveName: string): void;
}

const SaveGamesGrid = ({ id, autoFocus, onLoad }: SaveGamesGridProps) => {
  const saveManager = useDIDependency(SaveManager);
  const saves = useObservation(saveManager.saves$);

  return (
    <Stack
      id={id}
      direction="column"
      sx={{
        width: SaveGamesGridWidth,
      }}
      aria-busy={!saves ? "true" : "false"}
      aria-live="assertive"
    >
      {!saves && <CircularProgress aria-busy="true" color="inherit" />}
      {saves && saves.length === 0 && (
        <Typography justifySelf="center">No saves found</Typography>
      )}
      <Box
        role="list"
        sx={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          gap: `${GapWidth}px`,
          width: SaveGamesGridWidth,
          overflow: "auto",
        }}
      >
        {saves &&
          saves.map((save, index) => (
            <SaveGameItem
              key={index}
              autoFocus={index === 0 && autoFocus}
              save={save}
              onLoad={onLoad}
            />
          ))}
      </Box>
    </Stack>
  );
};

const SaveGameItem = ({
  autoFocus,
  save,
  onLoad,
}: {
  autoFocus?: boolean;
  save: SaveInfo;
  onLoad: (saveName: string) => void;
}) => {
  const id = React.useId();
  const { saveName, saveDate } = save;
  return (
    <Paper
      role="listitem"
      aria-labelledby={`${id}-label`}
      sx={{ width: 350, px: 2, pt: 2 }}
    >
      <Typography
        id={`${id}-label`}
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
      <Divider sx={{ mt: 1 }} orientation="horizontal" aria-hidden="true" />
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          width: "100%",
        }}
      >
        <Button
          sx={{ ml: "auto" }}
          onClick={() => onLoad(saveName)}
          aria-describedby={`${id}-label`}
          autoFocus={autoFocus}
        >
          Load
        </Button>
      </Box>
    </Paper>
  );
};

export default SaveGamesGrid;
