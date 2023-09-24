import * as React from "react";
import * as ReactDOM from "react-dom";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";

import { useGameSpeed } from "@/services/sh-game";

const GameNotPausedWarning = () => {
  const gameSpeed = useGameSpeed();
  // TODO: Place this centered below the appbar title in a floating box.
  const theme = useTheme();

  if (gameSpeed === null || gameSpeed === "Paused") {
    return null;
  }

  const content = (
    <Box
      sx={{
        position: "absolute",
        right: 0,
        bottom: "90px",
        backgroundColor: theme.palette.error.main,
        borderTopLeftRadius: 5,
        borderBottomLeftRadius: 5,
      }}
    >
      <Typography
        sx={{ px: 4 }}
        variant="body1"
        fontSize="2rem"
        color={theme.palette.error.contrastText}
      >
        Game is not paused
      </Typography>
    </Box>
  );

  return ReactDOM.createPortal(content, document.body);
};

export default GameNotPausedWarning;
