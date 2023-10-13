import * as React from "react";
import { map } from "rxjs";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Badge from "@mui/material/Badge";
import IconButton from "@mui/material/IconButton";
import Popover, { PopoverActions } from "@mui/material/Popover";
import PlayCircle from "@mui/icons-material/PlayCircle";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import { type SxProps } from "@mui/material/styles";

import SkipNextIcon from "@mui/icons-material/SkipNext";
import DownloadIcon from "@mui/icons-material/Download";

import { useDIDependency } from "@/container";
import { filterItemObservations } from "@/observables";

import { useObservation } from "@/hooks/use-observation";
import { useMutationObserver } from "@/hooks/use-mutation-observer";

import { TokensSource, TimeSource, SituationModel } from "@/services/sh-game";

import FocusIconButton from "./FocusIconButton";
import ScreenReaderContent from "./ScreenReaderContent";

interface RecipeExecutionsHeaderProps {
  sx?: SxProps;
}

const RecipeExecutionsHeader = ({ sx }: RecipeExecutionsHeaderProps) => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

  const onClick = React.useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    setAnchorEl(e.currentTarget);
  }, []);

  const actionsRef = React.useRef<PopoverActions>(null);
  const [executingSituationsRef, setExecutingSituationsRef] =
    React.useState<HTMLElement | null>(null);

  useMutationObserver(executingSituationsRef, () => {
    if (actionsRef.current == null) {
      return;
    }

    actionsRef.current.updatePosition();
  });

  const timeSource = useDIDependency(TimeSource);

  const secondsToTomorrow =
    useObservation(timeSource.secondsUntilTomorrow$) ?? Number.NaN;
  const secondsToTomorrowStr = secondsToTomorrow.toFixed(
    secondsToTomorrow > 60 ? 0 : 1
  );

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

  return (
    <>
      <Badge
        role="region"
        aria-label="Recipe Executions"
        badgeContent={executingSituations.length}
        color="primary"
        sx={{
          ["& .MuiBadge-badge"]: {
            right: 10,
            top: 10,
          },
          ...sx,
        }}
      >
        <IconButton
          aria-haspopup="menu"
          title="Recipe Executions"
          onClick={onClick}
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
          role="menu"
          ref={setExecutingSituationsRef}
          sx={{
            width: "400px",
          }}
        >
          <ListItem>
            <ListItemText sx={{ ml: 1 }} primary="Skip to Tomorrow" />
            <Box sx={{ ml: "auto" }}>
              <Typography variant="caption" role="timer">
                <ScreenReaderContent>
                  {secondsToTomorrowStr} seconds to tomorrow
                </ScreenReaderContent>
                <span aria-hidden="true">{secondsToTomorrowStr}s</span>
              </Typography>
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
    </>
  );
};

export default RecipeExecutionsHeader;

interface ExecutingSituationListItemProps {
  situation: SituationModel;
}
const ExecutingSituationListItem = ({
  situation,
}: ExecutingSituationListItemProps) => {
  const timeSource = useDIDependency(TimeSource);
  const label = useObservation(situation.label$);
  const recipeLabel = useObservation(situation.recipeLabel$);
  const timeRemaining = useObservation(situation.timeRemaining$) ?? Number.NaN;
  const state = useObservation(situation.state$);

  const timeRemainingStr = timeRemaining.toFixed(1);

  if (state !== "Ongoing" && state !== "Complete") {
    return null;
  }

  return (
    <ListItem>
      <FocusIconButton token={situation} />
      <ListItemText
        id={`executing-situation-${situation.id}-label`}
        sx={{ ml: 1 }}
        primary={label}
        secondary={recipeLabel}
      />
      <Box sx={{ ml: "auto" }}>
        {state === "Ongoing" && (
          <>
            <Typography variant="caption" role="timer">
              <ScreenReaderContent>
                {timeRemainingStr} seconds left in recipe
              </ScreenReaderContent>
              <span aria-hidden="true">{timeRemainingStr}s</span>
            </Typography>
            <IconButton
              title="Fast Forward to Completion"
              // Tick one tick past the end of the situation, so we dont hang on 0.0
              onClick={() => timeSource.passTime(timeRemaining + 0.1)}
            >
              <SkipNextIcon />
            </IconButton>
          </>
        )}
        {state === "Complete" && (
          <IconButton title="Complete" onClick={() => situation.conclude()}>
            <DownloadIcon />
          </IconButton>
        )}
      </Box>
    </ListItem>
  );
};
