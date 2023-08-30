import * as React from "react";
import { map } from "rxjs";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { useDIDependency } from "@/container";

import { powerAspects } from "@/aspects";

import { observeAll, useObservation } from "@/observables";

import { GameModel } from "@/services/sh-model";
import { filterHasAnyAspect } from "@/services/sh-model/observables";

import { RequireRunning } from "@/components/RequireLegacy";
import ElementDataGrid, {
  descriptionColumnDef,
  iconColumnDef,
  labelColumnDef,
  locationColumnDef,
  multiselectOptionsFilter,
  aspectsColumnDef,
} from "@/components/ElementDataGrid";

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
      iconColumnDef(),
      labelColumnDef(),
      locationColumnDef({
        filter: multiselectOptionsFilter(locations),
      }),
      aspectsColumnDef(powerAspects),
      descriptionColumnDef(),
    ],
    [locations]
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
      }}
    >
      <RequireRunning />
      <Typography
        variant="h4"
        sx={{ py: 2, width: "100%", textAlign: "center" }}
      >
        Hush House Stores and Provisions
      </Typography>
      <Box
        sx={{ width: "100%", height: "100%", minHeight: 0, overflow: "hidden" }}
      >
        <ElementDataGrid columns={columns} elements$={elements$} />
      </Box>
    </Box>
  );
};

export default ProvisionsCatalog;
