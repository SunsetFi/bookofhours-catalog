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
  descriptionColumnDef,
  iconColumnDef,
  labelColumnDef,
  locationColumnDef,
  multiselectOptionsFilter,
} from "@/components/ElementDataGrid";

const BookCatalog = () => {
  const api = useDIDependency(API);
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
      {
        // FIXME: Make an aspect column def using a value of {aspect, value}, load the aspect icon from the model.
        headerName: "Mastery",
        width: 150,
        observable: (elementStack) =>
          elementStack.elementAspects$.pipe(
            map((aspects) => {
              const masteryKey = Object.keys(aspects).find((x) =>
                x.startsWith("mystery.")
              );
              if (masteryKey == null) {
                return null;
              }

              return {
                aspect: masteryKey,
                value: aspects[masteryKey],
                // FIXME: Get this from a model.
                iconUrl: `${api.baseUrl}/api/compendium/elements/${masteryKey}/icon.png`,
              };
            })
          ),
        renderCell: ({ value }) => {
          if (value == null) {
            return null;
          }

          return (
            <Box
              component="span"
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                gap: 2,
              }}
            >
              <img style={{ width: "50px" }} src={value.iconUrl} />
              <Typography
                style={{ whiteSpace: "nowrap" }}
                component="span"
                variant="h4"
                color="text.secondary"
              >
                {value.value}
              </Typography>
            </Box>
          );
        },
      },
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
