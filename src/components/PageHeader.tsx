import React from "react";
import { useNavigate } from "react-router";

import { Typography, AppBar, Toolbar, IconButton, Box } from "@mui/material";

import { ArrowBack } from "@mui/icons-material";

import { useDIDependency } from "@/container";

import { PageManager } from "@/services/page";

import { useObservation } from "@/hooks/use-observation";

import HandOverviewIcons from "./HandOverviewIcons";
import PinboardHeader from "./PinboardHeader";
import SeasonAndTimeHeader from "./SeasonAndTimeHeader";
import SearchButtonHeader from "./SearchButtonHeader";
import RecipeExecutionsHeader from "./RecipeExecutionsHeader";
import GameMenuButton from "./GameMenuButton";

export interface PageHeaderProps {}

const PageHeader = () => {
  const pageManager = useDIDependency(PageManager);
  const title = useObservation(pageManager.title$) ?? pageManager.title;
  // Legacy
  const backTo = null;

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
          // This may be overkill and could possibly annoy screen reader users,
          // but we want to notify when the site loads and this is a good way to do it.
          aria-live="polite"
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
        <Box sx={{ width: "40px" }}>
          {backTo && (
            <IconButton
              aria-label="Back"
              size="large"
              edge="start"
              color="inherit"
              onClick={onBackClicked}
            >
              <ArrowBack />
            </IconButton>
          )}
          {!backTo && <GameMenuButton />}
        </Box>
        <HandOverviewIcons sx={{ ml: 2 }} />
        <Box sx={{ ml: "auto" }} />
        <PinboardHeader sx={{ py: 1 }} />
        <SearchButtonHeader sx={{ ml: 2 }} />
        <SeasonAndTimeHeader sx={{ ml: 2 }} />
        <RecipeExecutionsHeader sx={{ ml: 2 }} />
      </Toolbar>
    </AppBar>
  );
};

export default PageHeader;
