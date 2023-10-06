import * as React from "react";
import { Navigate } from "react-router-dom";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { useDIDependency } from "@/container";
import { useQueryString } from "@/hooks/use-querystring";

import {
  TokensSource,
  filterDoesNotOccupySpace,
  filterElementId,
  filterHasAnyAspect,
  filterHasNoneOfAspect,
} from "@/services/sh-game";

import PageContainer from "@/components/PageContainer";
import ElementStackTray from "@/components/ElementStackTray";
import { tap } from "rxjs";

const GameplayView = () => {
  const redirect = useQueryString("redirect");
  return (
    <PageContainer title="">
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
        <Overview />
      </Box>
    </PageContainer>
  );
};

const Overview = () => {
  const tokensSource = useDIDependency(TokensSource);

  const memories$ = React.useMemo(
    () => tokensSource.visibleElementStacks$.pipe(filterHasAnyAspect("memory")),
    [tokensSource.visibleElementStacks$]
  );

  const abilities$ = React.useMemo(
    () =>
      tokensSource.visibleElementStacks$.pipe(filterHasAnyAspect("ability")),
    [tokensSource.visibleElementStacks$]
  );

  const skills$ = React.useMemo(
    () => tokensSource.visibleElementStacks$.pipe(filterHasAnyAspect("skill")),
    [tokensSource.visibleElementStacks$]
  );

  const misc$ = React.useMemo(
    () =>
      tokensSource.visibleElementStacks$.pipe(
        filterDoesNotOccupySpace(["PhysicalObject"]),
        // We pick up tons of notes, which are text tokens that show up in situations.
        filterElementId((x) => x !== "tlg.note"),
        filterHasNoneOfAspect(["memory", "ability", "skill"])
      ),
    [tokensSource.visibleElementStacks$]
  );

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "grid",
        gridTemplateRows: `[start] max-content [dividier] 1fr [end]`,
        gridTemplateColumns: `[start] 15% [memories-soul] 20% [soul-skill] 45% [skill-misc] 20% [end]`,
      }}
    >
      <Box
        sx={{
          gridRow: "start / dividier",
          gridColumn: "start / end",
          display: "flex",
          flexDirection: "row",
          alignItems: "baseline",
          gap: 3,
        }}
      >
        <Typography variant="h1" sx={{ gridColumn: "start end" }}>
          Welcome, Librarian
        </Typography>
        <Typography
          variant="h6"
          sx={{ textAlign: "middle", color: "text.secondary" }}
        >
          Everything is accounted for, Hush House endures.
        </Typography>
      </Box>
      <ElementStackTray
        sx={{
          gridRow: "dividier / end",
          gridColumn: "start / memories-soul",
        }}
        elementStacks$={memories$}
      />
      <ElementStackTray
        sx={{
          gridRow: "dividier / end",
          gridColumn: "memories-soul / soul-skill",
        }}
        elementStacks$={abilities$}
      />
      <ElementStackTray
        sx={{
          gridRow: "dividier / end",
          gridColumn: "soul-skill / skill-misc",
        }}
        elementStacks$={skills$}
      />
      <ElementStackTray
        sx={{
          gridRow: "dividier / end",
          gridColumn: "skill-misc / end",
        }}
        elementStacks$={misc$}
      />
    </Box>
  );
};

export default GameplayView;
