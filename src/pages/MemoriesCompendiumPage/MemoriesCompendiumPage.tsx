import * as React from "react";

import Box from "@mui/material/Box";

import { useDIDependency } from "@/container";

import { powerAspects } from "@/aspects";

import { CharacterSource, filterHasAnyAspect } from "@/services/sh-game";
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

const MemoriesCompendiumPage = () => {
  const characterSource = useDIDependency(CharacterSource);

  const elements$ = React.useMemo(
    () =>
      characterSource.uniqueElementsManifested$.pipe(
        filterHasAnyAspect(["memory"])
      ),
    [characterSource]
  );

  const columns = React.useMemo(
    () => [
      iconColumnDef<ElementModel>(),
      labelColumnDef<ElementModel>(),
      aspectsColumnDef<ElementModel>(powerAspects),
      descriptionColumnDef<ElementModel>(),
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
