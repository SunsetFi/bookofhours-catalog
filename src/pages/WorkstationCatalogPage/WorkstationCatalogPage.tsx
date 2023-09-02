import * as React from "react";

import Box from "@mui/material/Box";

import ObservableDataGrid from "@/components/ObservableDataGrid";
import PageContainer from "@/components/PageContainer";
import { RequireRunning } from "@/components/RequireLegacy";

const WorkstationCatalogPage = () => {
  return (
    <PageContainer title="Workstations" backTo="/">
      <RequireRunning />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
        }}
      >
        <ObservableDataGrid
          sx={{ height: "100%" }}
          columns={columns}
          items$={items$}
        />
      </Box>
    </PageContainer>
  );
};
