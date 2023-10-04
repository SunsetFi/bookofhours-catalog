import * as React from "react";

import Box from "@mui/material/Box";

import { useDIDependency } from "@/container";

import { powerAspects } from "@/aspects";

import {
  CharacterSource,
  ModelWithAspects,
  ModelWithDescription,
  ModelWithIconUrl,
  ModelWithLabel,
  filterHasAnyAspect,
} from "@/services/sh-game";
import { ElementModel } from "@/services/sh-compendium";

import { useQueryObjectState } from "@/hooks/use-queryobject";

import { RequireRunning } from "@/components/RequireLegacy";
import ObservableDataGrid, {
  aspectsColumnDef,
  descriptionColumnDef,
  iconColumnDef,
  labelColumnDef,
} from "@/components/ObservableDataGrid";
import PageContainer from "@/components/PageContainer";
import { map } from "rxjs";

interface MemoriesRow
  extends ModelWithIconUrl,
    ModelWithLabel,
    ModelWithAspects,
    ModelWithDescription {
  id: string;
}

function elementToMemoryRow(element: ElementModel): MemoriesRow {
  return {
    id: element.elementId,
    iconUrl$: element.iconUrl$,
    label$: element.label$,
    aspects$: element.aspects$,
    description$: element.description$,
  };
}
const MemoriesCompendiumPage = () => {
  const characterSource = useDIDependency(CharacterSource);

  const elements$ = React.useMemo(
    () =>
      characterSource.uniqueElementsManifested$.pipe(
        filterHasAnyAspect(["memory"]),
        map((items) => items.map(elementToMemoryRow))
      ),
    [characterSource]
  );

  const columns = React.useMemo(
    () => [
      iconColumnDef<MemoriesRow>(),
      labelColumnDef<MemoriesRow>(),
      aspectsColumnDef<MemoriesRow>(powerAspects),
      descriptionColumnDef<MemoriesRow>(),
    ],
    []
  );

  const [filters, onFiltersChanged] = useQueryObjectState();

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

export default MemoriesCompendiumPage;
