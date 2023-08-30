import * as React from "react";
import { Navigate, Link as RouterLink } from "react-router-dom";
import { map } from "rxjs";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";

import { useDIDependency } from "@/container";

import { useObservation } from "@/observables";

import { useQueryString } from "@/hooks/use-querystring";

import { GameModel } from "@/services/sh-model";
import {
  filterHasAnyAspect,
  filterHasAspect,
} from "@/services/sh-model/observables";

const GameplayView = () => {
  const redirect = useQueryString("redirect");
  const model = useDIDependency(GameModel);

  const date = useObservation(model.date$) ?? null;

  const connectedTerrains = useObservation(model.unlockedTerrains$) ?? [];
  const books =
    useObservation(
      () => model.visibleElementStacks$.pipe(filterHasAspect("readable")),
      [model]
    ) ?? [];
  const elements =
    useObservation(
      () =>
        model.visibleElementStacks$.pipe(
          filterHasAnyAspect(["beverage", "brewable", "sustanance"])
        ),
      [model]
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
        Inventory of Hush House
      </Typography>
      {date && (
        <Typography variant="h2" sx={{ width: "100%", textAlign: "center" }}>
          {date.toFormat("MMMM d, yyyy")}
        </Typography>
      )}
      <Typography variant="h3" sx={{ width: "100%", textAlign: "center" }}>
        {connectedTerrains.length} locations restored.
      </Typography>
      <Typography variant="h3" sx={{ width: "100%", textAlign: "center" }}>
        <Link component={RouterLink} to="/book-catalog">
          {books.length} books cataloged.
        </Link>
      </Typography>
      <Typography variant="h3" sx={{ width: "100%", textAlign: "center" }}>
        <Link component={RouterLink} to="/provisions-catalog">
          {elements.length} provisions secured.
        </Link>
      </Typography>
    </Box>
  );
};

export default GameplayView;
