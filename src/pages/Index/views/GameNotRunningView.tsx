import * as React from "react";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { delay, of } from "rxjs";

import { useObservation } from "@/hooks/use-observation";

const GameNotRunningView = () => {
  const timedOut = useObservation(() => of(true).pipe(delay(5000)), []);

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Typography variant="h1">Hush House Catalogue</Typography>
      <Typography variant="body2">Waiting to connect...</Typography>
      {timedOut && (
        <Typography variant="body2">
          This seems to be taking a while. Are you sure the game is running?
        </Typography>
      )}
    </Box>
  );
};

export default GameNotRunningView;
