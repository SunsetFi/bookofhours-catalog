import React from "react";
import ReactDom from "react-dom";

import { Box, Stack, Typography, useTheme } from "@mui/material";

import { useDIDependency } from "@/container";

import { Orchestrator, SituationModel } from "@/services/sh-game";

import { useObservation } from "@/hooks/use-observation";
import { formatSeconds } from "@/utils";

const OrchestrationThumbs = () => {
  const orchestrator = useDIDependency(Orchestrator);
  const executingSituations =
    useObservation(orchestrator.executingSituations$) ?? [];

  const content = (
    <Box
      aria-hidden={true}
      sx={{
        position: "absolute",
        right: 20,
        top: 70,
        isolation: "isolate",
        height: "calc(100% - 70px)",
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      <Stack direction="column" spacing={2} sx={{ m: 2 }}>
        {executingSituations.map((situation) => (
          <SituationThumb key={situation.id} situation={situation} />
        ))}
      </Stack>
    </Box>
  );

  return ReactDom.createPortal(content, document.body);
};

interface SituationThumbProps {
  situation: SituationModel;
}

const ThumbSize = 75;

const SituationThumb = ({ situation }: SituationThumbProps) => {
  const theme = useTheme();
  const orchestrator = useDIDependency(Orchestrator);

  const label = useObservation(situation.label$);
  const iconUrl = useObservation(situation.iconUrl$);
  const state = useObservation(situation.state$);
  const output = useObservation(situation.output$) ?? [];
  const timeRemaining = useObservation(situation.timeRemaining$) ?? Number.NaN;

  if (!iconUrl) {
    return null;
  }

  let content: React.ReactNode = (
    <img
      style={{
        width: ThumbSize,
        height: ThumbSize,
        borderRadius: ThumbSize / 2,
      }}
      src={iconUrl}
    />
  );

  if (state === "Complete" && output.length > 0) {
    content = (
      <>
        {content}
        <Typography
          component="div"
          variant="body1"
          sx={{
            minWidth: "28px",
            height: "28px",
            border: "2px solid #888",
            borderRadius: "50%",
            backgroundColor: "#CCC",
            color: theme.palette.getContrastText("#CCC"),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "absolute",
            top: -10,
            right: -10,
            zIndex: 1,
          }}
        >
          {output.length}
        </Typography>
      </>
    );
  } else if (!Number.isNaN(timeRemaining) && timeRemaining > 0) {
    content = (
      <>
        {content}
        <Typography
          component="div"
          variant="body1"
          sx={{
            minWidth: "32px",
            height: "32px",
            border: "2px solid #888",
            borderRadius: "16px",
            backgroundColor: "#CCC",
            color: theme.palette.getContrastText("#CCC"),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "absolute",
            px: 1,
            bottom: -10,
            right: -10,
            zIndex: 1,
          }}
        >
          {formatSeconds(timeRemaining)}
        </Typography>
      </>
    );
  }

  return (
    <Box
      title={label}
      sx={{
        width: 75,
        height: 75,
        cursor: "pointer",
        position: "relative",
        pointerEvents: "initial",
      }}
      onClick={() => orchestrator.openOrchestration({ situation })}
    >
      {content}
    </Box>
  );
};

export default OrchestrationThumbs;
