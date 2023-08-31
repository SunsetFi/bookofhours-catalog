import * as React from "react";
import { map } from "rxjs";

import Box from "@mui/material/Box";

import { useDIDependency } from "@/container";

import { observeAll, useObservation } from "@/observables";

import { ElementStackModel, GameModel } from "@/services/sh-model";
import { filterHasAspect } from "@/services/sh-model/observables";

import { RequireRunning } from "@/components/RequireLegacy";

import ElementStackDataGrid from "@/components/ElementStackDataGrid";
import {
  aspectPresenceColumnDef,
  descriptionColumnDef,
  iconColumnDef,
  labelColumnDef,
  locationColumnDef,
  multiselectOptionsFilter,
} from "@/components/ObservableDataGrid";
import PageContainer from "@/components/PageContainer";
import { aspectsFilter } from "@/components/ObservableDataGrid/filters/aspects";

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
      iconColumnDef<ElementStackModel>(),
      labelColumnDef<ElementStackModel>(),
      locationColumnDef<ElementStackModel>({
        filter: multiselectOptionsFilter(locations),
      }),
      aspectPresenceColumnDef<ElementStackModel>(
        (aspectId) => aspectId.startsWith("mastery."),
        { display: "none" },
        { headerName: "Mastered", width: 125, filter: aspectsFilter("auto") }
      ),
      aspectPresenceColumnDef<ElementStackModel>(
        (aspectId) => aspectId.startsWith("mystery."),
        {},
        { headerName: "Mystery" }
      ),
      aspectPresenceColumnDef<ElementStackModel>(
        (aspectId) => aspectId.startsWith("contamination."),
        { display: "none" },
        { headerName: "Contamination", width: 200 }
      ),
      aspectPresenceColumnDef<ElementStackModel>(
        (aspectId) => aspectId.startsWith("w."),
        { display: "none" },
        { headerName: "Language", width: 100 }
      ),
      aspectPresenceColumnDef<ElementStackModel>(
        ["film", "record.phonograph"],
        { display: "none" },
        { headerName: "Type", width: 100 }
      ),
      descriptionColumnDef<ElementStackModel>(),
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
        <ElementStackDataGrid
          sx={{ height: "100%" }}
          columns={columns}
          items$={elements$}
        />
      </Box>
    </PageContainer>
  );
};

export default BookCatalog;
