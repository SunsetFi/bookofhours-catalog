import React from "react";
import { Aspects } from "secrethistories-api";
import { of, shareReplay } from "rxjs";

import { Lock as LockIcon } from "@mui/icons-material";

import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
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
  TokensSource,
  WisdomNodeTerrainModel,
} from "@/services/sh-game";

import { useObservation } from "@/hooks/use-observation";

import ElementStackCard, {
  DefaultElementStackCardHeight,
  DefaultElementStackCardWidth,
} from "@/components/Elements/ElementStackCard";
import ElementStackTray from "@/components/Elements/ElementStackTray";
import ElementIcon from "@/components/Elements/ElementIcon";

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
      {committed == null && !sealed && possibilities.length > 0 && (
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

  const effects = useObservation(
    () =>
      node.wisdomRecipe$.pipe(switchMapIfNotNull((recipe) => recipe.effects$)),
    [node]
  );

  const [committing, setCommitting] = React.useState(false);

  const onCardSelected = React.useCallback(
    (elementStack: ElementStackModel) => {
      if (!committing) {
        node.slotInput(elementStack);
      }
    },
    [committing, node]
  );

  return (
    <Dialog
      open={true}
      aria-labelledby="dialog-title"
      aria-describedby="dialog-content"
      onClose={onClose}
    >
      <DialogTitle id="dialog-title">{label}</DialogTitle>
      <DialogContent id="dialog-content">
        <Stack direction="column" spacing={2} sx={{ width: 500 }}>
          {committing && (
            <CircularProgress sx={{ alignSelf: "center" }} color="inherit" />
          )}
          {!committing && (
            <ElementStackTray
              elementStacks$={elementStacks$}
              onClick={onCardSelected}
              value={input}
            />
          )}
          <Divider />
          <Stack
            direction="column"
            spacing={1}
            alignItems="center"
            justifyContent="center"
          >
            <Typography>{description ?? "Choose a Card"}</Typography>

            <Stack direction="row" spacing={2}>
              {Object.keys(effects ?? {}).map((id) => (
                <ElementIcon key={id} elementId={id} />
              ))}
            </Stack>
          </Stack>
        </Stack>
      </DialogContent>
      {!committing && (
        <DialogActions>
          <Button
            variant="contained"
            disabled={input == null}
            onClick={async () => {
              console.log("We are committing and setting commit to true.");
              setCommitting(true);
              try {
                await node.commit();
                onClose();
              } finally {
                setCommitting(false);
              }
            }}
          >
            Commit
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};
