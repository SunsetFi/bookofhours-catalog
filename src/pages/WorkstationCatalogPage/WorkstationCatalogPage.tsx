import * as React from "react";
import { map } from "rxjs";

import Box from "@mui/material/Box";

import { useDIDependency } from "@/container";

import { observeAll, useObservation } from "@/observables";

import { powerAspects } from "@/aspects";

import { GameModel, SituationModel } from "@/services/sh-game";

import { RequireRunning } from "@/components/RequireLegacy";

import ObservableDataGrid, {
  aspectsPresenceColumnDef,
  aspectsPresenceFilter,
  descriptionColumnDef,
  labelColumnDef,
  locationColumnDef,
  multiselectOptionsFilter,
} from "@/components/ObservableDataGrid";
import PageContainer from "@/components/PageContainer";

const WorkstationCatalogPage = () => {
  const model = useDIDependency(GameModel);

  const elements$ = React.useMemo(() => model.unlockedWorkstations$, [model]);

  const locations =
    useObservation(
      `WorkstationCatalogPage locations`,
      () =>
        model.unlockedTerrains$.pipe(
          map((terrains) => terrains.map((terrain) => terrain.label$)),
          observeAll("WorkstationCatalogPage.locations")
        ),
      [model]
    ) ?? [];

  const columns = React.useMemo(
    () => [
      labelColumnDef<SituationModel>(),
      locationColumnDef<SituationModel>({
        filter: multiselectOptionsFilter(locations),
      }),
      aspectsPresenceColumnDef<SituationModel>(
        powerAspects,
        { display: "none", orientation: "horizontal" },
        {
          headerName: "Attunement",
          observable: "hints$",
          filter: aspectsPresenceFilter(powerAspects),
          width: 275,
        }
      ),
      aspectsPresenceColumnDef<SituationModel>(
        (aspect) => aspect.startsWith("e."),
        { display: "none" },
        // TODO: Dont use auto, find all possible evolutions
        { headerName: "Evolves", filter: aspectsPresenceFilter("auto") }
      ),
      descriptionColumnDef<SituationModel>(),
    ],
    [locations]
  );

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
          items$={elements$}
        />
      </Box>
    </PageContainer>
  );
};

export default WorkstationCatalogPage;
