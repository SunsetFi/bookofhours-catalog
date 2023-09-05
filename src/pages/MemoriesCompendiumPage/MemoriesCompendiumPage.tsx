import * as React from "react";

import Box from "@mui/material/Box";

import { useDIDependency } from "@/container";

import { powerAspects } from "@/aspects";

import { GameModel, filterHasAnyAspect } from "@/services/sh-game";
import { ElementModel } from "@/services/sh-compendium";

import { RequireRunning } from "@/components/RequireLegacy";
import ObservableDataGrid, {
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

  const columns = React.useMemo(
    () => [
      iconColumnDef<ElementModel>(),
      labelColumnDef<ElementModel>(),
      aspectsColumnDef<ElementModel>(powerAspects),
      descriptionColumnDef<ElementModel>(),
    ],
    []
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
        <ObservableDataGrid
          sx={{ height: "100%" }}
          columns={columns}
          items$={elements$}
        />
      </Box>
    </PageContainer>
  );
};

export default MemoriesCompendiumPage;
