import * as React from "react";
import { map } from "rxjs";

import Badge from "@mui/material/Badge";
import IconButton from "@mui/material/IconButton";
import Popover, { PopoverActions } from "@mui/material/Popover";
import PlayCircle from "@mui/icons-material/PlayCircle";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import type { SxProps } from "@mui/material/styles";
import SkipNextIcon from "@mui/icons-material/SkipNext";

import { useDIDependency } from "@/container";
import {
  filterItemObservations,
  observeAll,
  useObservation,
} from "@/observables";
import { useMutationObserver } from "@/hooks/use-mutation-observer";

import { SituationModel, TimeSource, TokensSource } from "@/services/sh-game";

import FocusIconButton from "./FocusIconButton";

export interface RecipeExecutionHeaderProps {
  sx?: SxProps;
}
const TimeAndRecipeHeader = ({ sx }: RecipeExecutionHeaderProps) => {
  const actionsRef = React.useRef<PopoverActions>(null);
  const [executingSituationsRef, setExecutingSituationsRef] =
    React.useState<HTMLElement | null>(null);
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

  useMutationObserver(executingSituationsRef, () => {
    if (actionsRef.current == null) {
      return;
    }

    actionsRef.current.updatePosition();
  });

  const tokensSource = useDIDependency(TokensSource);
  const executingSituations =
    useObservation(
      () =>
        tokensSource.visibleSituations$.pipe(
          filterItemObservations((s) =>
            s.state$.pipe(map((s) => s !== "Unstarted"))
          )
        ),
      [tokensSource]
    ) ?? [];

  const timeSource = useDIDependency(TimeSource);

  const secondsToTomorrow =
    useObservation(timeSource.secondsUntilTomorrow$) ?? Number.NaN;
  const secondsToTomorrowStr = secondsToTomorrow.toFixed(
    secondsToTomorrow > 60 ? 0 : 1
  );

  const secondsToNextEvent =
    useObservation(() =>
      tokensSource.visibleSituations$.pipe(
        map((situations) => situations.map((s) => s.timeRemaining$)),
        observeAll(),
        map((seconds) => Math.max(...seconds.filter((x) => x > 0)))
      )
    ) ?? Number.NaN;
  const hasNextEvent =
    !Number.isNaN(secondsToNextEvent) && secondsToNextEvent > 0;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: 1,
        ...sx,
      }}
    >
      {hasNextEvent && (
        <Typography
          component="span"
          variant="body2"
          title="Seconds to Next Event"
        >
          {secondsToNextEvent}
        </Typography>
      )}
      {!Number.isNaN(secondsToTomorrow) && (
        <>
          {" "}
          /{" "}
          <Typography
            component="span"
            variant="body2"
            title="Seconds Left in Day"
          >
            {secondsToTomorrowStr}
          </Typography>
        </>
      )}
      <Badge
        badgeContent={executingSituations.length}
        color="primary"
        sx={{
          ["& .MuiBadge-badge"]: {
            right: 10,
            top: 10,
          },
        }}
      >
        <IconButton
          title="Recipe Executions"
          onClick={(e) => setAnchorEl(e.currentTarget)}
        >
          <PlayCircle />
        </IconButton>
      </Badge>
      <Popover
        action={actionsRef}
        open={!!anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorEl={anchorEl}
        anchorOrigin={{
          horizontal: "right",
          vertical: "bottom",
        }}
      >
        <List
          ref={setExecutingSituationsRef}
          sx={{
            width: "400px",
          }}
        >
          <ListItem>
            <ListItemText sx={{ ml: 1 }} primary="Skip to Tomorrow" />
            <Box sx={{ ml: "auto" }}>
              <Typography variant="caption">{secondsToTomorrowStr}</Typography>
              <IconButton
                title="Fast Forward to Next Day"
                onClick={() => timeSource.passDay()}
              >
                <SkipNextIcon />
              </IconButton>
            </Box>
          </ListItem>
          {executingSituations.map((situation) => (
            <ExecutingSituationListItem
              key={situation.id}
              situation={situation}
            />
          ))}
        </List>
      </Popover>
    </Box>
  );
};

export default TimeAndRecipeHeader;

interface ExecutingSituationListItemProps {
  situation: SituationModel;
}
const ExecutingSituationListItem = ({
  situation,
}: ExecutingSituationListItemProps) => {
  const timeSource = useDIDependency(TimeSource);
  const label = useObservation(situation.verbLabel$);
  const recipeLabel = useObservation(situation.recipeLabel$);
  const timeRemaining = useObservation(situation.timeRemaining$) ?? Number.NaN;

  const timeRemainingStr = timeRemaining.toFixed(1);

  return (
    <ListItem>
      <FocusIconButton token={situation} />
      <ListItemText sx={{ ml: 1 }} primary={label} secondary={recipeLabel} />
      <Box sx={{ ml: "auto" }}>
        <Typography variant="caption">{timeRemainingStr}</Typography>
        <IconButton
          title="Fast Forward to Completion"
          // Tick one tick past the end of the situation, so we dont hang on 0.0
          onClick={() => timeSource.passTime(timeRemaining + 0.1)}
        >
          <SkipNextIcon />
        </IconButton>
      </Box>
    </ListItem>
  );
};
