import * as React from "react";
import { map } from "rxjs";

import Box from "@mui/material/Box";

import { useDIDependency } from "@/container";

import { observeAll, useObservation } from "@/observables";

import { furnishingAspects, powerAspects } from "@/aspects";

import {
  GameModel,
  ElementStackModel,
  filterHasAspect,
} from "@/services/sh-game";

import { RequireRunning } from "@/components/RequireLegacy";

import ElementStackDataGrid from "@/components/ElementStackDataGrid";
import {
  aspectsColumnDef,
  aspectPresenceColumnDef,
  descriptionColumnDef,
  iconColumnDef,
  labelColumnDef,
  locationColumnDef,
  multiselectOptionsFilter,
} from "@/components/ObservableDataGrid";
import PageContainer from "@/components/PageContainer";
import { aspectsFilter } from "@/components/ObservableDataGrid/filters/aspects";

const FurnishingsCatalogPage = () => {
  const model = useDIDependency(GameModel);

  const elements$ = React.useMemo(
    () => model.visibleElementStacks$.pipe(filterHasAspect(furnishingAspects)),
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
      aspectPresenceColumnDef<ElementStackModel>(
        furnishingAspects,
        { display: "none" },
        {
          headerName: "Type",
          width: 150,
          filter: aspectsFilter(furnishingAspects),
        }
      ),
      descriptionColumnDef<ElementStackModel>(),
    ],
    [locations]
  );

  return (
    <PageContainer title="An Accounting of the Walls and Floors" backTo="/">
      <RequireRunning />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
        }}
      >
        <ElementStackDataGrid
          sx={{ height: "100%" }}
          columns={columns}
          items$={elements$}
        />
      </Box>
    </PageContainer>
  );
};

export default FurnishingsCatalogPage;
