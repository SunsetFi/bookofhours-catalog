import * as React from "react";
import { map } from "rxjs";

import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";

import VisibilityIcon from "@mui/icons-material/Visibility";

import { useDIDependency } from "@/container";

import { observeAll, useObservation } from "@/observables";

import { materialAspects, powerAspects } from "@/aspects";

import {
  GameModel,
  ElementStackModel,
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

const MaterialsCatalogPage = () => {
  const model = useDIDependency(GameModel);

  const elements$ = React.useMemo(
    // Much more than just materials.  This is whatever I find useful to Make Things With
    () => model.visibleElementStacks$.pipe(filterHasAspect(materialAspects)),
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
