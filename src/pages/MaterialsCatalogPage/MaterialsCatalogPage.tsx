import * as React from "react";
import { map } from "rxjs";

import Box from "@mui/material/Box";

import { useDIDependency } from "@/container";

import { observeAll, useObservation } from "@/observables";

import { materialAspects, powerAspects } from "@/aspects";

import {
  ElementStackModel,
  TokensSource,
  filterHasAspect,
} from "@/services/sh-game";

import { useQueryObjectState } from "@/hooks/use-queryobject";

import { RequireRunning } from "@/components/RequireLegacy";

import ObservableDataGrid, {
  ObservableDataGridColumnDef,
  aspectsColumnDef,
  aspectsPresenceColumnDef,
  aspectsPresenceFilter,
  descriptionColumnDef,
  iconColumnDef,
  labelColumnDef,
  locationColumnDef,
  multiselectOptionsFilter,
} from "@/components/ObservableDataGrid";
import PageContainer from "@/components/PageContainer";
import FocusIconButton from "@/components/FocusIconButton";

const MaterialsCatalogPage = () => {
  const tokensSource = useDIDependency(TokensSource);

  const elements$ = React.useMemo(
    // Much more than just materials.  This is whatever I find useful to Make Things With
    () =>
      tokensSource.visibleElementStacks$.pipe(filterHasAspect(materialAspects)),
    [tokensSource]
  );

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
            <FocusIconButton token={value} />
          </Box>
        ),
      } as ObservableDataGridColumnDef<ElementStackModel>,
      iconColumnDef<ElementStackModel>(),
      labelColumnDef<ElementStackModel>(),
      locationColumnDef<ElementStackModel>({
        filter: multiselectOptionsFilter("location", locations),
      }),
      aspectsColumnDef<ElementStackModel>(powerAspects),
      aspectsPresenceColumnDef<ElementStackModel>(
        materialAspects,
        { display: "none" },
        {
          headerName: "Type",
          width: 175,
          filter: aspectsPresenceFilter("type", materialAspects),
        }
      ),
      descriptionColumnDef<ElementStackModel>(),
    ],
    [locations]
  );

  const [filters, onFiltersChanged] = useQueryObjectState();

  return (
    <PageContainer title="Malleary Shelf" backTo="/">
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
          filters={filters}
          onFiltersChanged={onFiltersChanged}
        />
      </Box>
    </PageContainer>
  );
};

export default MaterialsCatalogPage;
