import * as React from "react";
import { Navigate } from "react-router-dom";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { useQueryString } from "@/hooks/use-querystring";

import PageContainer from "@/components/PageContainer";
import { useDIDependency } from "@/container";
import { TimeSource } from "@/services/sh-game";
import { useObservation } from "@/observables";

const GameplayView = () => {
  const redirect = useQueryString("redirect");
  return (
    <PageContainer title="">
      <Box
        sx={{
          p: 2,
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {redirect != null && <Navigate to={redirect} />}
        <Overview />
      </Box>
    </PageContainer>
  );
};

const Overview = () => {
  const timeSource = useDIDependency(TimeSource);
  const seasonName = useObservation(timeSource.seasonName$);
  const seasonDescription = useObservation(timeSource.seasonDescription$);
  const daysInSeason = useObservation(timeSource.daysUntilNextSeason$);
  return (
    <Box
      sx={{
        pt: 4,
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Typography variant="h1" sx={{ textAlign: "middle" }}>
        Welcome, Librarian
      </Typography>
      <Typography variant="h6" sx={{ textAlign: "middle" }}>
        Everything is accounted for, Hush House endures.
      </Typography>
      <Typography variant="h4">
        {seasonName}, {seasonDescription}
      </Typography>
      <Typography variant="h6">{daysInSeason} days remain.</Typography>
    </Box>
  );
};

export default GameplayView;
