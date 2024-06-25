import React from "react";
import { useNavigate } from "react-router";

import { Typography, AppBar, Toolbar, IconButton, Box } from "@mui/material";

import { ArrowBack } from "@mui/icons-material";

import HandOverviewIcons from "./HandOverviewIcons";
import PinboardHeader from "./PinboardHeader";
import SeasonAndTimeHeader from "./SeasonAndTimeHeader";
import SearchButtonHeader from "./SearchButtonHeader";
import RecipeExecutionsHeader from "./RecipeExecutionsHeader";

export interface PageHeaderProps {
  title: string;
  backTo?: string;
}

const PageHeader = ({ title, backTo }: PageHeaderProps) => {
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
        </Box>
        <HandOverviewIcons />
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
