import * as React from "react";
import {
  Observable,
  combineLatest,
  map,
  mergeMap,
  of as observableOf,
} from "rxjs";

import { Aspects } from "secrethistories-api";
import { pick, first } from "lodash";

import Box from "@mui/material/Box";

import VisibilityIcon from "@mui/icons-material/Visibility";

import { powerAspects } from "@/aspects";

import { useDIDependency } from "@/container";

import { mapArrayItemsCached, observeAll, useObservation } from "@/observables";

import { Compendium } from "@/services/sh-compendium";

import {
  ElementStackModel,
  GameModel,
  filterHasAspect,
  ModelWithAspects,
  ModelWithDescription,
  ModelWithIconUrl,
  ModelWithLabel,
  ModelWithParentTerrain,
} from "@/services/sh-game";

import { RequireRunning } from "@/components/RequireLegacy";

import PageContainer from "@/components/PageContainer";
import ObservableDataGrid, {
  aspectsPresenceColumnDef,
  aspectsObservableColumnDef,
  aspectsPresenceFilter,
  descriptionColumnDef,
  iconColumnDef,
  labelColumnDef,
  locationColumnDef,
  multiselectOptionsFilter,
  aspectsColumnDef,
} from "@/components/ObservableDataGrid";
import { aspectsFilter } from "@/components/ObservableDataGrid/filters/aspects";
import { ObservableDataGridColumnDef } from "@/components/ObservableDataGrid/types";
import { IconButton } from "@mui/material";

interface BookModel
  extends ModelWithAspects,
    ModelWithDescription,
    ModelWithIconUrl,
    ModelWithLabel,
    ModelWithParentTerrain {
  focus(): void;
  id: string;
  memoryLabel$: Observable<string | null>;
  memoryAspects$: Observable<Aspects>;
}

function elementStackToBook(
  elementStack: ElementStackModel,
  compendium: Compendium
): BookModel {
  const memory$ = combineLatest([
    elementStack.aspects$,
    elementStack.element$,
  ]).pipe(
    mergeMap(([aspects, element]) => {
      const mastery = Object.keys(aspects).find((aspectId) =>
        aspectId.startsWith("mastery.")
      );
      if (!mastery || aspects[mastery] < 1) {
        return observableOf(null);
      }

      return element.xtriggers$.pipe(
        map((xtriggers) => {
          for (var key of Object.keys(xtriggers).filter((x) =>
            x.startsWith("reading.")
          )) {
            return first(xtriggers[key])?.id ?? null;
          }

          return null;
        })
      );
    }),
    map((memoryId) => (memoryId ? compendium.getElementById(memoryId) : null))
  );

  const memoryLabel$ = memory$.pipe(
    mergeMap(
      (memory) =>
        memory?.label$.pipe(
          map((label) =>
            label?.startsWith("Memory: ") ? label.substring(8) : label
          )
        ) ?? observableOf(null)
    )
  );

  const memoryAspects$ = memory$.pipe(
    mergeMap(
      (memory) =>
        memory?.aspects$.pipe(map((aspects) => pick(aspects, powerAspects))) ??
        observableOf({})
    )
  );

  return {
    get id() {
      return elementStack.id;
    },

    get label$() {
      return elementStack.label$;
    },
    get description$() {
      return elementStack.description$;
    },
    get iconUrl() {
      return elementStack.iconUrl;
    },
    get aspects$() {
      return elementStack.aspects$;
    },
    get parentTerrain$() {
      return elementStack.parentTerrain$;
    },
    memoryLabel$,
    memoryAspects$,
    focus: () => elementStack.focus(),
  };
}

const BookCatalogPage = () => {
  const model = useDIDependency(GameModel);
  const compendium = useDIDependency(Compendium);

  const items$ = React.useMemo(
    () =>
      model.visibleElementStacks$.pipe(
        filterHasAspect("readable"),
        mapArrayItemsCached((item) => elementStackToBook(item, compendium))
      ),
    [model]
  );

  // We do have "auto" now, but its probably best to show
  // the locations the user has unlocked, so they can confirm there is nothing in it.
  const locations =
    useObservation(
      () =>
        model.unlockedTerrains$.pipe(
          map((terrains) => terrains.map((terrain) => terrain.label$)),
          observeAll()
        ),
      [model]
    ) ?? [];

  const columns = React.useMemo<ObservableDataGridColumnDef<BookModel>[]>(
    () => [
      {
        headerName: "",
        width: 50,
        field: "focus",
        renderCell: ({ value }) => (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <IconButton onClick={() => value()}>
              <VisibilityIcon />
            </IconButton>
          </Box>
        ),
      } as ObservableDataGridColumnDef<BookModel>,
      iconColumnDef<BookModel>(),
      labelColumnDef<BookModel>(),
      locationColumnDef<BookModel>({
        filter: multiselectOptionsFilter(locations),
      }),
      aspectsColumnDef<BookModel>(
        (aspectId) => aspectId.startsWith("mystery."),
        {
          headerName: "Mystery",
          filter: aspectsFilter("auto"),
          aspectIconSize: 50,
        }
      ),
      aspectsPresenceColumnDef<BookModel>(
        (aspectId) => aspectId.startsWith("mastery."),
        { display: "none" },
        {
          headerName: "Mastered",
          sortable: false,
          width: 125,
          filter: aspectsPresenceFilter("auto"),
        }
      ),
      {
        headerName: "Memory",
        width: 150,
        observable: "memoryLabel$",
        sortable: true,
      },
      aspectsObservableColumnDef<BookModel>(
        (element) => element.memoryAspects$,
        powerAspects,
        {
          headerName: "Memory Aspects",
          width: 210,
        }
      ),
      aspectsPresenceColumnDef<BookModel>(
        (aspectId) => aspectId.startsWith("w."),
        { display: "none" },
        { headerName: "Language", width: 125, filter: aspectsFilter("auto") }
      ),
      aspectsPresenceColumnDef<BookModel>(
        ["film", "record.phonograph"],
        { display: "none" },
        {
          headerName: "Type",
          width: 125,
          filter: aspectsFilter(["film", "record.phonograph"]),
        }
      ),
      aspectsPresenceColumnDef<BookModel>(
        (aspectId) => aspectId.startsWith("contamination."),
        { display: "none" },
        {
          headerName: "Contamination",
          width: 200,
          filter: aspectsFilter("auto"),
        }
      ),
      descriptionColumnDef<BookModel>(),
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
        <ObservableDataGrid
          sx={{ height: "100%" }}
          columns={columns}
          items$={items$}
        />
      </Box>
    </PageContainer>
  );
};

export default BookCatalogPage;
