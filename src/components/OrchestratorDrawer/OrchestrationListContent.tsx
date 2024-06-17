import React from "react";
import { map } from "rxjs";
import { values } from "lodash";

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
  Icon,
} from "@mui/material";
import {
  SkipNext as SkipNextIcon,
  Download as DownloadIcon,
  Error as ErrorIcon,
  PlayArrow,
} from "@mui/icons-material";

import { useDIDependency } from "@/container";

import { useObservation } from "@/hooks/use-observation";

import {
  Orchestrator,
  SituationModel,
  TimeSource,
  TokensSource,
  filterTokenNotInPath,
} from "@/services/sh-game";

import FocusIconButton from "../FocusIconButton";
import ScreenReaderContent from "../ScreenReaderContent";
import OrchestrationContentHeader from "./OrchestratonContentHeader";
import { tokenPathContainsChild } from "@/utils";

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
            <Divider orientation="horizontal" />
          </>
        )}
        {fixedSituations.map((situation) => (
          <SituationListItem situation={situation} key={situation.id} />
        ))}
        <Divider />
        <ListItemButton
          onClick={() => orchestrator.openOrchestration({ situation: null })}
        >
          <ListItemText primary="Start an Activity" />
          <Box sx={{ ml: "auto" }}>
            <IconButton title="Start an Activity">
              <PlayArrow />
            </IconButton>
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
  const orchestrator = useDIDependency(Orchestrator);

  const timeSource = useDIDependency(TimeSource);
  const label = useObservation(situation.verbLabel$);
  const recipeLabel = useObservation(situation.recipeLabel$);
  const state = useObservation(situation.state$);
  const output = useObservation(situation.output$) ?? [];

  const isFixed =
    tokenPathContainsChild("~/fixedverbs", situation.path) ||
    tokenPathContainsChild("~/arrivalverbs", situation.path);

  const timeRemaining = useObservation(situation.timeRemaining$) ?? Number.NaN;
  const timeRemainingStr = timeRemaining.toFixed(1);

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

  if (state !== "Unstarted" && state !== "Ongoing" && state !== "Complete") {
    return null;
  }

  const hasLabel = label !== "." && label !== situation.verbId;

  return (
    <ListItemButton onClick={onClick}>
      {!isFixed && <FocusIconButton token={situation} />}
      <ListItemText
        id={`situation-${situation.id}-label`}
        sx={{ ml: isFixed ? 0 : 1 }}
        primary={!hasLabel ? recipeLabel : label}
        secondary={!hasLabel ? null : recipeLabel}
      />
      <Box sx={{ ml: "auto", display: "flex", alignItems: "center" }}>
        {state === "Unstarted" && (
          <IconButton title="Start an Action">
            <PlayArrow />
          </IconButton>
        )}
        {state === "Ongoing" && (
          <>
            {hasEmptyThresholds && (
              <Tooltip title="Empty Card Slots" sx={{ m: 2 }}>
                <Icon aria-hidden="false" aria-label="Empty Card Slots">
                  <ErrorIcon aria-label="Empty Card Slots" />
                </Icon>
              </Tooltip>
            )}
            <Typography variant="caption" role="timer">
              <ScreenReaderContent>
                {timeRemainingStr} seconds left in recipe
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
