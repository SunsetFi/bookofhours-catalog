import * as React from "react";
import { map } from "rxjs";

import Box from "@mui/material/Box";

import { useDIDependency } from "@/container";

import { observeAll, useObservation } from "@/observables";

import { powerAspects } from "@/aspects";

import { GameModel } from "@/services/sh-model";
import { filterHasAnyAspect } from "@/services/sh-model/observables";
import { ElementModel } from "@/services/sh-compendium/ElementModel";

import { RequireRunning } from "@/components/RequireLegacy";
import ElementDataGrid from "@/components/ElementDataGrid";
import {
  aspectsColumnDef,
  descriptionColumnDef,
  iconColumnDef,
  labelColumnDef,
} from "@/components/ObservableDataGrid";
import PageContainer from "@/components/PageContainer";

const MemoriesCompendiumPage = () => {
  const model = useDIDependency(GameModel);

  const elements$ = React.useMemo(
    () => model.uniqueElementsManifested$.pipe(filterHasAnyAspect(["memory"])),
    [model]
  );

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
      iconColumnDef<ElementModel>(),
      labelColumnDef<ElementModel>(),
      aspectsColumnDef<ElementModel>(powerAspects),
      descriptionColumnDef<ElementModel>(),
    ],
    [locations]
  );

  return (
    <PageContainer title="Memories" backTo="/">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
        }}
      >
        <RequireRunning />
        <ElementDataGrid
          sx={{ height: "100%" }}
          columns={columns}
          items$={elements$}
        />
      </Box>
    </PageContainer>
  );
};

export default MemoriesCompendiumPage;
