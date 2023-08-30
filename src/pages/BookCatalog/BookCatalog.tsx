import * as React from "react";
import { map } from "rxjs";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { useDIDependency } from "@/container";

import { observeAll, useObservation } from "@/observables";

import { GameModel } from "@/services/sh-model";
import { API } from "@/services/sh-api";
import { filterHasAspect } from "@/services/sh-model/observables";

import { RequireLegacy } from "@/components/RequireLegacy";
import ElementDataGrid, {
  aspectPresenceColumnDef,
  descriptionColumnDef,
  iconColumnDef,
  labelColumnDef,
  locationColumnDef,
  multiselectOptionsFilter,
} from "@/components/ElementDataGrid";

const BookCatalog = () => {
  const model = useDIDependency(GameModel);

  const elements$ = React.useMemo(
    () => model.visibleElementStacks$.pipe(filterHasAspect("readable")),
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
      aspectPresenceColumnDef(
        (aspectId) => aspectId.startsWith("mastery."),
        { display: "none" },
        { headerName: "Mastered", width: 100 }
      ),
      aspectPresenceColumnDef(
        (aspectId) => aspectId.startsWith("mystery."),
        {},
        { headerName: "Mystery" }
      ),
      aspectPresenceColumnDef(
        (aspectId) => aspectId.startsWith("w."),
        { display: "none" },
        { headerName: "Language", width: 100 }
      ),
      aspectPresenceColumnDef(
        ["film", "record.phonograph"],
        { display: "none" },
        { headerName: "Type", width: 100 }
      ),
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
      <RequireLegacy />
      <Typography
        variant="h4"
        sx={{ py: 2, width: "100%", textAlign: "center" }}
      >
        The Hush House Bibliographical Collection
      </Typography>
      <Box
        sx={{ width: "100%", height: "100%", minHeight: 0, overflow: "hidden" }}
      >
        <ElementDataGrid columns={columns} elements$={elements$} />
      </Box>
    </Box>
  );
};

export default BookCatalog;
