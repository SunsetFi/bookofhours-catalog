import * as React from "react";

import Box from "@mui/material/Box";

import PageHeader from "./PageHeader";

export interface PageContainerProps {
  title: string;
  backTo?: string;
  children: React.ReactNode;
}

const PageContainer = ({ title, backTo, children }: PageContainerProps) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
      }}
    >
      <PageHeader title={title} backTo={backTo} />
      <Box sx={{ flexGrow: 1, overflow: "auto" }}>{children}</Box>
    </Box>
  );
};

export default PageContainer;
