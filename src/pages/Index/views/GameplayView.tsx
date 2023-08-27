import * as React from "react";
import { useObservableState } from "observable-hooks";
import { Navigate, Link as RouterLink } from "react-router-dom";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";

import { useDIDependency } from "@/container";

import { useQueryString } from "@/hooks/use-querystring";

import { GameModel } from "@/services/sh-monitor";

const GameplayView = () => {
  const redirect = useQueryString("redirect");
  const model = useDIDependency(GameModel);

  const legacyLabel = useObservableState(model.legacyLabel$);
  const connectedTerrains = useObservableState(model.unlockedTerrains, []);
  const books = useObservableState(model.visibleReadables$, []);

  return (
    <Box
      sx={{
        p: 2,
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {redirect != null && <Navigate to={redirect} />}
      <Typography variant="h1" sx={{ width: "100%", textAlign: "center" }}>
        {legacyLabel}
      </Typography>
      <Typography variant="h3" sx={{ width: "100%", textAlign: "center" }}>
        {connectedTerrains.length} locations restored
      </Typography>
      <Typography variant="h3" sx={{ width: "100%", textAlign: "center" }}>
        <Link component={RouterLink} to="/book-catalog">
          {books.length} books cataloged
        </Link>
      </Typography>
    </Box>
  );
};

export default GameplayView;
