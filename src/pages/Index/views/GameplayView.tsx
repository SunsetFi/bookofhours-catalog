import * as React from "react";
import { Navigate, Link as RouterLink } from "react-router-dom";
import { map } from "rxjs";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";

import { useDIDependency } from "@/container";

import { useObservation } from "@/observables";

import { useQueryString } from "@/hooks/use-querystring";

import { GameModel } from "@/services/sh-monitor";
import { filterHasAspect } from "@/services/sh-monitor/observables";

const GameplayView = () => {
  const redirect = useQueryString("redirect");
  const model = useDIDependency(GameModel);

  const legacyLabel = useObservation(model.legacyLabel$);
  const connectedTerrains = useObservation(model.unlockedTerrains$) ?? [];
  const books =
    useObservation(
      () => model.visibleElementStacks$.pipe(filterHasAspect("readable")),
      []
    ) ?? [];

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
