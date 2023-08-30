import * as React from "react";
import { map } from "rxjs";

import Box from "@mui/material/Box";

import { useDIDependency } from "@/container";

import { observeAll, useObservation } from "@/observables";

import { GameModel } from "@/services/sh-model";
import { filterHasAspect } from "@/services/sh-model/observables";

import { RequireRunning } from "@/components/RequireLegacy";
import ElementDataGrid, {
  aspectPresenceColumnDef,
  descriptionColumnDef,
  iconColumnDef,
  labelColumnDef,
  locationColumnDef,
  multiselectOptionsFilter,
} from "@/components/ElementDataGrid";
import PageContainer from "@/components/PageContainer";

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
    <PageContainer title="Bibliographical Collection" backTo="/">
      <RequireRunning />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
        }}
      >
        <ElementDataGrid columns={columns} elements$={elements$} />
      </Box>
    </PageContainer>
  );
};

export default BookCatalog;
