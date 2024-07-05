import React from "react";
import { Aspects } from "secrethistories-api";
import { of, shareReplay } from "rxjs";

import { Lock as LockIcon } from "@mui/icons-material";

import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Stack,
  SxProps,
  Typography,
} from "@mui/material";

import { useDIDependency } from "@/container";

import { EmptyArray$, switchMapIfNotNull } from "@/observables";

import {
  ElementStackModel,
  filterMatchesEssentials,
  filterMatchesForbiddens,
  filterMatchesRequirements,
  filterTokenInPath,
  TokensSource,
  WisdomNodeTerrainModel,
} from "@/services/sh-game";

import { useObservation } from "@/hooks/use-observation";

import ElementStackCard, {
  DefaultElementStackCardHeight,
  DefaultElementStackCardWidth,
} from "@/components/Elements/ElementStackCard";
import ElementStackTray from "@/components/Elements/ElementStackTray";

export interface WisdomNodeSlotProps {
  sx?: SxProps;
  wisdomLabel: string;
  node: WisdomNodeTerrainModel;
}

const NeverMatch: Aspects = { NonExistantAspect: 99 };
const EmptyMatch: Aspects = {};
const WisdomNodeSlot = ({ node, wisdomLabel }: WisdomNodeSlotProps) => {
  const tokensSource = useDIDependency(TokensSource);
  const committed = useObservation(node.committed$);
  const sealed = useObservation(node.sealed$);

  const requirements = useObservation(node.requirements$) ?? NeverMatch;
  const essentials = useObservation(node.essentials$) ?? NeverMatch;
  const forbiddens = useObservation(node.forbiddens$) ?? EmptyMatch;

  const possibilities =
    useObservation(
      () =>
        committed == null && !sealed
          ? tokensSource.visibleElementStacks$.pipe(
              filterMatchesEssentials(essentials),
              filterMatchesRequirements(requirements),
              filterMatchesForbiddens(forbiddens),
              shareReplay(1)
            )
          : EmptyArray$,
      [committed, sealed, tokensSource, essentials, requirements, forbiddens]
    ) ?? [];

  const [choosingCandidate, setChoosingCandidate] = React.useState(false);

  React.useEffect(() => {
    if (committed || possibilities.length === 0) {
      setChoosingCandidate(false);
    }
  }, [committed, possibilities]);

  return (
    <Box
      sx={{
        width: DefaultElementStackCardWidth + 5,
        height: DefaultElementStackCardHeight + 5,
        border: "2px solid #888",
        borderRadius: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {committed == null && sealed && <LockIcon />}
      {committed && (
        <ElementStackCard elementStack={committed} interactable={false} />
      )}
      {possibilities.length > 0 && (
        <Button onClick={() => setChoosingCandidate(true)}>
          {possibilities.length} candidates
        </Button>
      )}
      {choosingCandidate && (
        <ChooseWisdomCardDialog
          label={wisdomLabel}
          node={node}
          candidates={possibilities}
          onClose={() => setChoosingCandidate(false)}
        />
      )}
    </Box>
  );
};

export default WisdomNodeSlot;

interface ChooseWisdomCardDialogProps {
  label: string;
  node: WisdomNodeTerrainModel;
  candidates: ElementStackModel[];
  onClose(): void;
}

const ChooseWisdomCardDialog = ({
  label,
  node,
  candidates,
  onClose,
}: ChooseWisdomCardDialogProps) => {
  const elementStacks$ = React.useMemo(() => of(candidates), [candidates]);

  const input = useObservation(node.input$) ?? null;

  const description = useObservation(
    () =>
      node.wisdomRecipe$.pipe(
        switchMapIfNotNull((recipe) => recipe.startDescription$)
      ),
    [node]
  );

  return (
    <Dialog open={true} onClose={onClose}>
      <DialogTitle>{label}</DialogTitle>
      <DialogContent>
        <Stack direction="column" spacing={2} sx={{ width: 480 }}>
          <ElementStackTray
            elementStacks$={elementStacks$}
            onClick={(elementStack) => node.slotInput(elementStack)}
            value={input}
          />
          <Typography textAlign="center">{description}</Typography>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};
