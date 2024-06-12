import React from "react";

import { Box, Stack, styled } from "@mui/material";

import PageHeader from "./PageHeader";
import PageTabs from "./PageTabs";
import GameNotPausedWarning from "./GameNotPausedWarning";

import OrchestratorDrawer from "./OrchestratorDrawer";

export interface PageContainerProps {
  title: string;
  backTo?: string;
  children: React.ReactNode;
}

const Main = styled("main", {
  shouldForwardProp: (prop) => prop !== "marginRight",
})<{}>(({ theme }) => ({
  flexGrow: 1,

  /**
   * This is necessary to enable the selection of content. In the DOM, the stacking order is determined
   * by the order of appearance. Following this rule, elements appearing later in the markup will overlay
   * those that appear earlier. Since the Drawer comes after the Main content, this adjustment ensures
   * proper interaction with the underlying content.
   */
  position: "relative",
  width: "100%",
  height: "100%",
  minWidth: 0,
}));

const PageContainer = ({ title, backTo, children }: PageContainerProps) => {
  return (
    <Stack direction="row" sx={{ width: "100%", height: "100%" }}>
      <Stack
        direction="column"
        sx={{
          width: "100%",
          height: "100%",
        }}
      >
        <GameNotPausedWarning />
        <PageHeader title={title} backTo={backTo} />
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            flexGrow: 1,
            width: "100%",
            height: "100%",
            minHeight: 0,
          }}
        >
          <PageTabs />
          <Main>{children}</Main>
        </Box>
      </Stack>
      <OrchestratorDrawer />
    </Stack>
  );
};

export default PageContainer;
