import React from "react";
import { Box, CircularProgress } from "@mui/material";

import { useDIDependency } from "@/container";

import { useObservation } from "@/hooks/use-observation";
import {
  TokensSource,
  filterDoesNotOccupySpace,
  filterElementId,
  filterHasAnyAspect,
  filterHasNoneOfAspect,
} from "@/services/sh-game";

import ElementStackTray from "@/components/Elements/ElementStackTray";
import PageContainer from "@/components/PageContainer";

const DeskPage = () => {
  const tokensSource = useDIDependency(TokensSource);
  const tokens = useObservation(tokensSource.visibleTokens$);

  const important$ = React.useMemo(
    () =>
      tokensSource.visibleElementStacks$.pipe(
        filterHasAnyAspect(["journal", "visitor", "incident"])
      ),
    [tokensSource.visibleElementStacks$]
  );

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
        filterHasNoneOfAspect([
          "memory",
          "ability",
          "skill",
          "journal",
          "visitor",
          "incident",
        ])
      ),
    [tokensSource.visibleElementStacks$]
  );

  return (
    <PageContainer title="Librarian's Desk">
      <Box sx={{ width: "100%", height: "100%", overflow: "auto" }}>
        <Box
          sx={{
            p: 2,
            width: "100%",
            height: "100%",
            display: "grid",
            gridTemplateRows: `[start] max-content [dividier] 1fr [end]`,
            gridTemplateColumns: `[start] 2fr [memories-soul] 3fr [soul-skill] 4fr [skill-misc] 2fr [end]`,
            gap: 2,
          }}
        >
          {tokens == null && (
            <Box
              sx={{
                gridRow: "start / end",
                gridColumn: "start / end",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                height: "100%",
              }}
            >
              <CircularProgress />
            </Box>
          )}
          <ElementStackTray
            aria-label="important"
            role="region"
            sx={{
              gridRow: "start / dividier",
              gridColumn: "start / end",
            }}
            elementStacks$={important$}
          />
          <ElementStackTray
            aria-label="memories"
            role="region"
            sx={{
              gridRow: "dividier / end",
              gridColumn: "start / memories-soul",
            }}
            elementStacks$={memories$}
          />
          <ElementStackTray
            aria-label="abilities"
            role="region"
            sx={{
              gridRow: "dividier / end",
              gridColumn: "memories-soul / soul-skill",
            }}
            elementStacks$={abilities$}
          />
          <ElementStackTray
            aria-label="skills"
            role="region"
            sx={{
              gridRow: "dividier / end",
              gridColumn: "soul-skill / skill-misc",
            }}
            elementStacks$={skills$}
          />
          <ElementStackTray
            aria-label="miscelanious"
            role="region"
            sx={{
              gridRow: "dividier / end",
              gridColumn: "skill-misc / end",
            }}
            elementStacks$={misc$}
          />
        </Box>
      </Box>
    </PageContainer>
  );
};

export default DeskPage;
