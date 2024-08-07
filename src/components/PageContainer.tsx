import React from "react";

import { Box } from "@mui/material";
import { useDIDependency } from "@/container";

import { PageManager } from "@/services/page";

export interface PageContainerProps {
  title: string;
  children: React.ReactNode;
}

const PageContainer = ({ title, children }: PageContainerProps) => {
  const pageManager = useDIDependency(PageManager);

  React.useLayoutEffect(() => {
    pageManager.setTitle(title);
    return () => {
      pageManager.setTitle(null);
    };
  }, [title]);

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        overflow: "auto",
        boxSizing: "border-box",
      }}
    >
      {children}
    </Box>
  );
};

export default PageContainer;
