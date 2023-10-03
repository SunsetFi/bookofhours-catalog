import * as React from "react";

import Box from "@mui/material/Box";

import { useDIDependency } from "@/container";

import { SituationModel, TokensSource } from "@/services/sh-game";

import { useQueryObjectState } from "@/hooks/use-queryobject";

import { RequireRunning } from "@/components/RequireLegacy";
import PageContainer from "@/components/PageContainer";
import ObservableDataGrid, {
  ObservableDataGridColumnDef,
  descriptionColumnDef,
  labelColumnDef,
  locationColumnDef,
} from "@/components/ObservableDataGrid";
import FocusIconButton from "@/components/FocusIconButton";

const HarvestCatalogPage = () => {
  const tokensSource = useDIDependency(TokensSource);

  const columns = React.useMemo(
    () => [
      {
        headerName: "",
        width: 50,
        field: "$item",
        renderCell: ({ value }) => (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <FocusIconButton token={value} />
          </Box>
        ),
      } as ObservableDataGridColumnDef<SituationModel>,
      labelColumnDef<SituationModel>(),
      locationColumnDef<SituationModel>(),
      descriptionColumnDef<SituationModel>(),
    ],
    []
  );

  const [filters, onFiltersChanged] = useQueryObjectState();

  return (
    <PageContainer title="Gardens and Glades" backTo="/">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
        }}
      >
        <RequireRunning />
        <ObservableDataGrid
          sx={{ height: "100%" }}
          columns={columns}
          items$={tokensSource.unlockedHarvestStations$}
          filters={filters}
          onFiltersChanged={onFiltersChanged}
        />
      </Box>
    </PageContainer>
  );
};

export default HarvestCatalogPage;
