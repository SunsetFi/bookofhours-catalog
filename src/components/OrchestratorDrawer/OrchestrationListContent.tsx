import React from "react";
import { firstValueFrom, map } from "rxjs";
import { isNull, values } from "lodash";
import { useTheme } from "@mui/material";
import { aspectsMatchRequirements } from "secrethistories-api";
import { useDrop } from "react-dnd";

import {
  List,
  ListItem,
  Box,
  Typography,
  IconButton,
  Divider,
  ListItemButton,
  ListItemText,
  Badge,
  Stack,
  Tooltip,
} from "@mui/material";
import {
  SkipNext as SkipNextIcon,
  Download as DownloadIcon,
  Error as ErrorIcon,
  PlayArrow,
} from "@mui/icons-material";

import { useDIDependency } from "@/container";

import { filterItemObservations } from "@/observables";
import { tokenPathContainsChild } from "@/utils";

import { ElementStackDraggable } from "@/draggables/element-stack";

import { useObservation } from "@/hooks/use-observation";

import {
  Orchestrator,
  SituationModel,
  TimeSource,
  TokensSource,
  filterTokenNotInPath,
  isThresholdedOrchestration,
} from "@/services/sh-game";

import FocusIconButton from "../FocusIconButton";
import ScreenReaderContent from "../ScreenReaderContent";

import OrchestrationContentHeader from "./OrchestratonContentHeader";

const OrchestrationListContent = () => {
  const orchestrator = useDIDependency(Orchestrator);
  const tokensSource = useDIDependency(TokensSource);
  const fixedSituations = useObservation(tokensSource.fixedSituations$) ?? [];
  const executingSituations =
    useObservation(
      () =>
        orchestrator.executingSituations$.pipe(
          filterTokenNotInPath("~/fixedverbs")
        ),
      [orchestrator.executingSituations$]
    ) ?? [];

  const timeSource = useDIDependency(TimeSource);
  const secondsToTomorrow =
    useObservation(timeSource.secondsUntilTomorrow$) ?? Number.NaN;
  const secondsToTomorrowStr = secondsToTomorrow.toFixed(
    secondsToTomorrow > 60 ? 0 : 1
  );

  return (
    <Stack direction="column">
      <OrchestrationContentHeader title="Activities" />
      <List>
        {!Number.isNaN(secondsToTomorrow) && (
          <>
            <ListItem>
              <ListItemText primary="Skip to Tomorrow" />
              <Box sx={{ ml: "auto" }}>
                <Typography variant="caption" role="timer">
                  <ScreenReaderContent>
                    {secondsToTomorrowStr} seconds to tomorrow
                  </ScreenReaderContent>
                  <span aria-hidden="true">{secondsToTomorrowStr}s</span>
                </Typography>
                <IconButton
                  title="Skip to Tomorrow"
                  onClick={() => timeSource.passDay()}
                >
                  <SkipNextIcon />
                </IconButton>
              </Box>
            </ListItem>
            <Divider aria-hidden="true" orientation="horizontal" />
          </>
        )}
        {fixedSituations.map((situation) => (
          <SituationListItem situation={situation} key={situation.id} />
        ))}
        <Divider aria-hidden="true" />
        <ListItemButton
          onClick={() => orchestrator.openOrchestration({ situation: null })}
        >
          <ListItemText primary="Start an Activity" />
          <Box sx={{ ml: "auto" }} aria-hidden={true}>
            <PlayArrow />
          </Box>
        </ListItemButton>
        {executingSituations.length > 0 && <Divider orientation="horizontal" />}
        {executingSituations.map((situation) => (
          <SituationListItem situation={situation} key={situation.id} />
        ))}
      </List>
    </Stack>
  );
};

export default OrchestrationListContent;

interface SituationListItemProps {
  situation: SituationModel;
}
const SituationListItem = ({ situation }: SituationListItemProps) => {
  const theme = useTheme();
  const orchestrator = useDIDependency(Orchestrator);

  const timeSource = useDIDependency(TimeSource);
  const verbLabel = useObservation(situation.verbLabel$);
  // Some recipes have ".", which presumably means it inherits from something else.
  // What that is, I don't know, but the 'label' property is correct.
  const situationLabel = useObservation(situation.label$);
  const state = useObservation(situation.state$);
  const output = useObservation(situation.output$) ?? [];

  const isFixed =
    tokenPathContainsChild("~/fixedverbs", situation.path) ||
    tokenPathContainsChild("~/arrivalverbs", situation.path);

  const timeRemaining = useObservation(situation.timeRemaining$) ?? Number.NaN;
  const timeRemainingStr = timeRemaining.toFixed(1);

  const thresholds = useObservation(situation.thresholds$) ?? [];

  const hasEmptyThresholds = useObservation(
    () =>
      situation.thresholdContents$.pipe(
        map((contents) => values(contents).some((x) => x === null))
      ),
    [situation]
  );

  const onAltAction = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (state === "Ongoing") {
        // Tick one tick past the end of the situation, so we dont hang on 0.0
        timeSource.passTime(timeRemaining + 0.1);
      } else if (state === "Complete") {
        situation.conclude();
      }
    },
    [state, situation, timeSource]
  );

  const onClick = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.shiftKey) {
        onAltAction(e);
        return;
      }

      orchestrator.openOrchestration({ situation });
    },
    [orchestrator, onAltAction]
  );

  const [{ isOver, canDrop }, dropRef] = useDrop(
    {
      accept: ElementStackDraggable,
      canDrop(item: ElementStackDraggable) {
        // TODO: We want to know if we fit any existing slots
        if (state !== "Unstarted" && state !== "Ongoing") {
          return false;
        }

        if (thresholds.length === 0) {
          return false;
        }

        // FIXME: Make sure there is a slot that is empty.
        return thresholds.some((spec) =>
          aspectsMatchRequirements(item.elementStack.aspects, spec)
        );
      },
      async drop(item, monitor) {
        if (!monitor.canDrop()) {
          return;
        }

        // FIXME: Lot of work here that should be wrapped into orchestrator.
        // This should be in a parameter for the OrchestrationRequest

        const orchestration = await orchestrator.openOrchestration({
          situation,
        });
        if (!orchestration || !isThresholdedOrchestration(orchestration)) {
          return;
        }

        const slots = await firstValueFrom(
          orchestration.slots$.pipe(
            filterItemObservations((slot) => slot.assignment$.pipe(map(isNull)))
          )
        );
        const match = values(slots).find((slot) =>
          aspectsMatchRequirements(item.elementStack.aspects, slot.spec)
        );
        if (!match) {
          return;
        }

        match.assign(item.elementStack);
      },
      collect(monitor) {
        return {
          isOver: monitor.isOver(),
          canDrop: monitor.canDrop(),
        };
      },
    },
    [thresholds, state]
  );

  if (state !== "Unstarted" && state !== "Ongoing" && state !== "Complete") {
    return null;
  }

  const hasVerbLabel = verbLabel !== "." && verbLabel !== situation.verbId;

  return (
    <ListItemButton
      ref={dropRef}
      onClick={onClick}
      sx={{
        ...(canDrop && {
          backgroundColor: theme.palette.action.selected,
        }),
        ...(canDrop &&
          isOver && {
            backgroundColor: theme.palette.primary.main,
          }),
      }}
    >
      {!isFixed && <FocusIconButton token={situation} />}
      <ListItemText
        id={`situation-${situation.id}-label`}
        sx={{ ml: isFixed ? 0 : 1 }}
        primary={!hasVerbLabel ? situationLabel : verbLabel}
        // This looks a little funny, to have situationLabel down here twice,
        // but this SHOULD be recipeLabel, only recipeLabel is sometimes ".",
        // im not sure what it resolves to in that case, and the situation label
        // correctly reflects the recipe in this case.
        secondary={state === "Unstarted" ? null : situationLabel}
      />
      <Box sx={{ ml: "auto", display: "flex", alignItems: "center" }}>
        {state === "Unstarted" && (
          <Tooltip title="Start an Action">
            {/* Dont need screen readers to see this as the entire line item is a button that starts the action. */}
            <PlayArrow aria-hidden="true" />
          </Tooltip>
        )}
        {state === "Ongoing" && (
          <>
            {hasEmptyThresholds && (
              <Tooltip title="Empty Card Slots" sx={{ m: 2 }}>
                <ErrorIcon aria-hidden="false" aria-label="Empty Card Slots" />
              </Tooltip>
            )}
            <Typography variant="caption" role="timer">
              <ScreenReaderContent>
                {timeRemainingStr} seconds left
              </ScreenReaderContent>
              <span aria-hidden="true">{timeRemainingStr}s</span>
            </Typography>
            <IconButton
              title="Fast Forward to Completion"
              onClick={onAltAction}
            >
              <SkipNextIcon />
            </IconButton>
          </>
        )}
        {state === "Complete" && (
          <Badge badgeContent={output.length}>
            <IconButton title="Complete" onClick={onAltAction}>
              <DownloadIcon />
            </IconButton>
          </Badge>
        )}
      </Box>
    </ListItemButton>
  );
};
