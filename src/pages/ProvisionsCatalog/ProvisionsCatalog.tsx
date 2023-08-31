import * as React from "react";
import { map } from "rxjs";

import Box from "@mui/material/Box";

import { useDIDependency } from "@/container";

import { powerAspects } from "@/aspects";

import { observeAll, useObservation } from "@/observables";

import { ElementStackModel, GameModel } from "@/services/sh-model";
import { filterHasAnyAspect } from "@/services/sh-model/observables";

import { RequireRunning } from "@/components/RequireLegacy";
import ElementStackDataGrid from "@/components/ElementStackDataGrid";
import {
  descriptionColumnDef,
  iconColumnDef,
  labelColumnDef,
  locationColumnDef,
  multiselectOptionsFilter,
  aspectsColumnDef,
} from "@/components/ObservableDataGrid";
import PageContainer from "@/components/PageContainer";

const ProvisionsCatalog = () => {
  const model = useDIDependency(GameModel);

  const elements$ = React.useMemo(
    () =>
      model.visibleElementStacks$.pipe(
        filterHasAnyAspect(["beverage", "brewable", "sustanance"])
      ),
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
      iconColumnDef<ElementStackModel>(),
      labelColumnDef<ElementStackModel>(),
      locationColumnDef<ElementStackModel>({
        filter: multiselectOptionsFilter(locations),
      }),
      aspectsColumnDef<ElementStackModel>(powerAspects),
      descriptionColumnDef<ElementStackModel>(),
    ],
    [locations]
  );

  return (
    <PageContainer title="Stores and Provisions" backTo="/">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
        }}
      >
        <RequireRunning />
        <ElementStackDataGrid
          sx={{ height: "100%" }}
          columns={columns}
          items$={elements$}
        />
      </Box>
    </PageContainer>
  );
};

export default ProvisionsCatalog;
