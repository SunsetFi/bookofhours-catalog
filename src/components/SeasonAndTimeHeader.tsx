import * as React from "react";
import { map } from "rxjs";

import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import type { SxProps } from "@mui/material/styles";

import HourglassBottomIcon from "@mui/icons-material/HourglassBottom";

import { useDIDependency } from "@/container";
import { observeAll } from "@/observables";

import { useObservation } from "@/hooks/use-observation";

import { TimeSource, TokensSource } from "@/services/sh-game";
import ScreenReaderContent from "./ScreenReaderContent";

export interface SeasonAndTimeHeaderProps {
  sx?: SxProps;
}
const SeasonAndTimeHeader = ({ sx }: SeasonAndTimeHeaderProps) => {
  const timeSource = useDIDependency(TimeSource);
  const tokensSource = useDIDependency(TokensSource);

  const seasonName = useObservation(timeSource.seasonName$);
  const seasonDescription = useObservation(timeSource.seasonDescription$);
  const daysInSeason = useObservation(timeSource.daysUntilNextSeason$);

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
  const secondsToNextEventStr = secondsToNextEvent.toFixed(
    secondsToNextEvent > 60 ? 0 : 1
  );

  const hasSecondsToTomorrow = !Number.isNaN(secondsToTomorrow);
  const hasNextEvent =
    !Number.isNaN(secondsToNextEvent) && secondsToNextEvent > 0;

  return (
    <Box
      role="region"
      aria-label="Time and Season"
      sx={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: 1,
        ...sx,
      }}
    >
      <HourglassBottomIcon fontSize="large" />
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        <Box sx={{ display: "flex" }}>
          {hasNextEvent && (
            <Typography
              role="timer"
              component="div"
              variant="body2"
              title="Time to Next Event"
            >
              <ScreenReaderContent>
                {secondsToNextEventStr} seconds to next event
              </ScreenReaderContent>
              <span aria-hidden="true">{secondsToNextEventStr}s</span>
            </Typography>
          )}
          {hasSecondsToTomorrow && (
            <>
              <Box component="span" sx={{ mx: 1 }}>
                /
              </Box>
              <Typography
                role="timer"
                component="span"
                variant="body2"
                title="Seconds Left in Day"
              >
                <ScreenReaderContent>
                  {secondsToTomorrowStr} seconds left in day
                </ScreenReaderContent>
                <span aria-hidden="true">{secondsToTomorrowStr}s</span>
              </Typography>
            </>
          )}
        </Box>
        <Box sx={{ display: "flex" }}>
          <Tooltip title={seasonDescription}>
            <Typography variant="body2" fontSize="0.8em" sx={{ mr: 1 }}>
              {seasonName ?? "Time stands still"}
            </Typography>
          </Tooltip>
          {daysInSeason != null && (
            <Typography
              variant="body2"
              fontSize="0.8em"
              sx={{ color: "text.secondary" }}
            >
              {daysInSeason} day{daysInSeason != 1 ? "s" : ""} remain
              {daysInSeason == 1 ? "s" : ""}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default SeasonAndTimeHeader;
