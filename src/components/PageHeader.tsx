import React from "react";
import { useNavigate } from "react-router";

import Typography from "@mui/material/Typography";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";

import ArrowBack from "@mui/icons-material/ArrowBack";

import { useDIDependency } from "@/container";

import { useObservation } from "@/observables";

import { GameModel } from "@/services/sh-model";

import HandOverviewIcons from "./HandOverviewIcons";

export interface PageHeaderProps {
  title: string;
  backTo?: string;
}

const PageHeader = ({ title, backTo }: PageHeaderProps) => {
  const model = useDIDependency(GameModel);
  const date = useObservation(model.date$) ?? null;

  const navigate = useNavigate();
  const onBackClicked = React.useCallback(() => {
    if (!backTo) {
      return;
    }

    navigate(backTo);
  }, [backTo]);

  return (
    <AppBar position="static">
      <Toolbar sx={{ position: "relative" }}>
        <Typography
          variant="h3"
          component="div"
          sx={{
            p: 1,
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            top: 0,
            bottom: 0,
            textAlign: "center",
          }}
        >
          {title}
        </Typography>
        {backTo && (
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            onClick={onBackClicked}
          >
            <ArrowBack />
          </IconButton>
        )}
        {date && date.isValid && (
          <Typography variant="body2" sx={{ ml: 2 }}>
            {date.toFormat("MMMM d, yyyy")}
          </Typography>
        )}
        <HandOverviewIcons sx={{ ml: 2 }} />
      </Toolbar>
    </AppBar>
  );
};

export default PageHeader;
