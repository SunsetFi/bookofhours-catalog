import * as React from "react";
import { map } from "rxjs";

import Box from "@mui/material/Box";

import { useDIDependency } from "@/container";

import { powerAspects, provisionsAspects } from "@/aspects";

import { observeAll, useObservation } from "@/observables";

import {
  ElementStackModel,
  GameModel,
  filterHasAnyAspect,
} from "@/services/sh-game";

import { RequireRunning } from "@/components/RequireLegacy";
import ElementStackDataGrid from "@/components/ElementStackDataGrid";
import {
  descriptionColumnDef,
  iconColumnDef,
  labelColumnDef,
  locationColumnDef,
  multiselectOptionsFilter,
  aspectsColumnDef,
  aspectPresenceColumnDef,
} from "@/components/ObservableDataGrid";
import PageContainer from "@/components/PageContainer";
import { aspectsFilter } from "@/components/ObservableDataGrid/filters/aspects";

const ProvisionsCatalog = () => {
  const model = useDIDependency(GameModel);

  const elements$ = React.useMemo(
    () =>
      model.visibleElementStacks$.pipe(filterHasAnyAspect(provisionsAspects)),
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
      aspectPresenceColumnDef<ElementStackModel>(
        provisionsAspects,
        { display: "none" },
        { headerName: "Type", filter: aspectsFilter(provisionsAspects) }
      ),
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
