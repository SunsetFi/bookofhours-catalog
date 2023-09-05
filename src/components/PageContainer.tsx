import * as React from "react";
import { delay, of } from "rxjs";

import Box from "@mui/material/Box";

import PageHeader from "./PageHeader";
import PageTabs from "./PageTabs";
import { useObservation } from "@/observables";

export interface PageContainerProps {
  title: string;
  backTo?: string;
  children: React.ReactNode;
}

const PageContainer = ({ title, backTo, children }: PageContainerProps) => {
  // HACK: Defer rendering the children until the next tick, so that our navigation can rerender immediately.
  // This helps the feel of the page immensely.
  // Instead of this, we should have PageContainer be outside of the route.
  const renderDelay = true; //useObservation(() => of(true).pipe(delay(100)), []);
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
        <Box sx={{ flexGrow: 1, width: "100%", height: "100%" }}>
          {renderDelay && children}
        </Box>
      </Box>
    </Box>
  );
};

export default PageContainer;
