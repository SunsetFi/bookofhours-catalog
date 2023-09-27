import * as React from "react";
import { map } from "rxjs";

import Box from "@mui/material/Box";

import { useDIDependency } from "@/container";

import { observeAll, useObservation } from "@/observables";

import { SituationModel, TokensSource } from "@/services/sh-game";

import { useQueryObjectState } from "@/hooks/use-queryobject";

import { RequireRunning } from "@/components/RequireLegacy";
import PageContainer from "@/components/PageContainer";
import ObservableDataGrid, {
  ObservableDataGridColumnDef,
  descriptionColumnDef,
  labelColumnDef,
  locationColumnDef,
  multiselectOptionsFilter,
} from "@/components/ObservableDataGrid";
import FocusIconButton from "@/components/FocusIconButton";

const HarvestCatalogPage = () => {
  const tokensSource = useDIDependency(TokensSource);

  const locations =
    useObservation(
      () =>
        tokensSource.unlockedTerrains$.pipe(
          map((terrains) => terrains.map((terrain) => terrain.label$)),
          observeAll()
        ),
      [tokensSource]
    ) ?? [];

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
            <FocusIconButton onClick={() => value.focus()} />
          </Box>
        ),
      } as ObservableDataGridColumnDef<SituationModel>,
      labelColumnDef<SituationModel>(),
      locationColumnDef<SituationModel>({
        filter: multiselectOptionsFilter("location", locations),
      }),
      descriptionColumnDef<SituationModel>(),
    ],
    [locations]
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
