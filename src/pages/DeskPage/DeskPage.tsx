import React from "react";
import {
  Box,
  CircularProgress,
  Stack,
  SxProps,
  Typography,
} from "@mui/material";
import { Observable } from "rxjs";

import { useDIDependency } from "@/container";

import { useObservation } from "@/hooks/use-observation";
import {
  ElementStackModel,
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

  const notable$ = React.useMemo(
    () =>
      tokensSource.visibleElementStacks$.pipe(
        filterHasAnyAspect([
          "journal",
          "visitor",
          "incident",
          "correspondence",
          "form.order",
        ])
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
          // In general, this excludes every card we have in the above lists.
          "memory",
          "ability",
          "skill",
          "journal",
          "visitor",
          "incident",
          "correspondence",
          "form.order",
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
            gap: 4,
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
              <CircularProgress color="inherit" />
            </Box>
          )}
          <ElementStackRegion
            sx={{
              gridRow: "start / dividier",
              gridColumn: "start / end",
            }}
            label="Notables"
            elementStacks$={notable$}
          />
          <ElementStackRegion
            sx={{
              gridRow: "dividier / end",
              gridColumn: "start / memories-soul",
            }}
            label="Memories and Lessons"
            elementStacks$={memories$}
          />
          <ElementStackRegion
            sx={{
              gridRow: "dividier / end",
              gridColumn: "memories-soul / soul-skill",
            }}
            label="Aspects of the Soul"
            elementStacks$={abilities$}
          />
          <ElementStackRegion
            sx={{
              gridRow: "dividier / end",
              gridColumn: "soul-skill / skill-misc",
            }}
            label="Skills and Languages"
            elementStacks$={skills$}
          />
          <ElementStackRegion
            sx={{
              gridRow: "dividier / end",
              gridColumn: "skill-misc / end",
            }}
            label="Sundries"
            elementStacks$={misc$}
          />
        </Box>
      </Box>
    </PageContainer>
  );
};

interface ElementStackRegionProps {
  sx?: SxProps;
  label: string;
  elementStacks$: Observable<ElementStackModel[]>;
  emptyContent?: React.ReactNode;
}

const ElementStackRegion: React.FC<ElementStackRegionProps> = ({
  sx,
  label,
  elementStacks$,
  emptyContent,
}) => {
  return (
    <Stack aria-label={label} role="region" direction="column" gap={2} sx={sx}>
      <Stack direction="row" gap={2} alignItems="center">
        <Typography variant="h6" aria-hidden="true" flexShrink={0}>
          {label}
        </Typography>
        <Box
          sx={{
            height: 0,
            width: "100%",
            borderBottom: "1px solid",
            borderColor: "text.primary",
          }}
        />
      </Stack>
      <ElementStackTray
        elementStacks$={elementStacks$}
        emptyContent={emptyContent}
      />
    </Stack>
  );
};

export default DeskPage;
