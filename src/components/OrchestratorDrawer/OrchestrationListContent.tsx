import React from "react";

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
} from "@mui/material";
import {
  SkipNext as SkipNextIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";

import { useDIDependency } from "@/container";

import { useObservation } from "@/hooks/use-observation";

import { Orchestrator, SituationModel, TimeSource } from "@/services/sh-game";

import FocusIconButton from "../FocusIconButton";
import ScreenReaderContent from "../ScreenReaderContent";
import OrchestrationContentHeader from "./OrchestratonContentHeader";

const OrchestrationListContent = () => {
  const orchestrator = useDIDependency(Orchestrator);
  const executingSituations =
    useObservation(orchestrator.executingSituations$) ?? [];

  const timeSource = useDIDependency(TimeSource);
  const secondsToTomorrow =
    useObservation(timeSource.secondsUntilTomorrow$) ?? Number.NaN;
  const secondsToTomorrowStr = secondsToTomorrow.toFixed(
    secondsToTomorrow > 60 ? 0 : 1
  );

  return (
    <Stack direction="column">
      <OrchestrationContentHeader title="Orchestrations" />
      <List>
        {!Number.isNaN(secondsToTomorrow) && (
          <>
            <ListItem>
              <ListItemText sx={{ ml: 6 }} primary="Skip to Tomorrow" />
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
            {executingSituations.map((situation) => (
              <ExecutingSituationListItem
                situation={situation}
                key={situation.id}
              />
            ))}
          </>
        )}
      </List>
    </Stack>
  );
};

export default OrchestrationListContent;

interface ExecutingSituationListItemProps {
  situation: SituationModel;
}
const ExecutingSituationListItem = ({
  situation,
}: ExecutingSituationListItemProps) => {
  const orchestrator = useDIDependency(Orchestrator);

  const timeSource = useDIDependency(TimeSource);
  const label = useObservation(situation.label$);
  const recipeLabel = useObservation(situation.recipeLabel$);
  const timeRemaining = useObservation(situation.timeRemaining$) ?? Number.NaN;
  const state = useObservation(situation.state$);
  const output = useObservation(situation.output$) ?? [];

  const timeRemainingStr = timeRemaining.toFixed(1);

  const onClick = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.shiftKey) {
        if (state === "Ongoing") {
          // Tick one tick past the end of the situation, so we dont hang on 0.0
          timeSource.passTime(timeRemaining + 0.1);
        } else if (state === "Complete") {
          situation.conclude();
        }

        return;
      }

      orchestrator.openOrchestration({ situation });
    },
    [state, situation, timeSource, orchestrator]
  );

  if (state !== "Ongoing" && state !== "Complete") {
    return null;
  }

  const hasLabel = label !== "." && label !== situation.verbId;

  return (
    <ListItemButton onClick={onClick}>
      <FocusIconButton token={situation} />
      <ListItemText
        id={`executing-situation-${situation.id}-label`}
        sx={{ ml: 1 }}
        primary={!hasLabel ? recipeLabel : label}
        secondary={!hasLabel ? null : recipeLabel}
      />
      <Box sx={{ ml: "auto", display: "flex", alignItems: "center" }}>
        {state === "Ongoing" && (
          <>
            {/* TODO: Show if we have empty slots. */}
            <Typography variant="caption" role="timer">
              <ScreenReaderContent>
                {timeRemainingStr} seconds left in recipe
              </ScreenReaderContent>
              <span aria-hidden="true">{timeRemainingStr}s</span>
            </Typography>
            <IconButton title="Fast Forward to Completion" onClick={onClick}>
              <SkipNextIcon />
            </IconButton>
          </>
        )}
        {state === "Complete" && (
          <Badge badgeContent={output.length}>
            {/* TODO: Show dialog of output. */}
            <IconButton title="Complete" onClick={onClick}>
              <DownloadIcon />
            </IconButton>
          </Badge>
        )}
      </Box>
    </ListItemButton>
  );
};
