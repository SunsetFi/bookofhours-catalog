import * as React from "react";
import { map } from "rxjs";

import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";

import VisibilityIcon from "@mui/icons-material/Visibility";

import { useDIDependency } from "@/container";

import { observeAll, useObservation } from "@/observables";

import { GameModel, SituationModel } from "@/services/sh-game";

import { useQueryObjectState } from "@/hooks/use-queryobject";

import { RequireRunning } from "@/components/RequireLegacy";
import ObservableDataGrid, {
  descriptionColumnDef,
  labelColumnDef,
  locationColumnDef,
  multiselectOptionsFilter,
} from "@/components/ObservableDataGrid";
import PageContainer from "@/components/PageContainer";
import { ObservableDataGridColumnDef } from "@/components/ObservableDataGrid/types";

const HarvestCatalogPage = () => {
  const model = useDIDependency(GameModel);

  const locations =
    useObservation(
      () =>
        model.unlockedTerrains$.pipe(
          map((terrains) => terrains.map((terrain) => terrain.label$)),
          observeAll()
        ),
      [model]
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
            <IconButton onClick={() => value.focus()}>
              <VisibilityIcon />
            </IconButton>
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
          items$={model.unlocekdHarvestStations$}
          filters={filters}
          onFiltersChanged={onFiltersChanged}
        />
      </Box>
    </PageContainer>
  );
};

export default HarvestCatalogPage;
