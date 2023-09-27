import * as React from "react";
import { Observable, combineLatest, firstValueFrom, map, mergeMap } from "rxjs";

import { Aspects } from "secrethistories-api";
import { pick, first } from "lodash";

import Box from "@mui/material/Box";

import { powerAspects } from "@/aspects";

import { useDIDependency } from "@/container";

import {
  Null$,
  mapArrayItemsCached,
  mergeMapIfNotNull,
  observableObjectOrEmpty,
  observeAll,
  useObservation,
} from "@/observables";

import { Compendium } from "@/services/sh-compendium";
import { Orchestrator } from "@/services/sh-game/orchestration";
import { Pinboard } from "@/services/sh-pins/Pinboard";
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

import { useQueryObjectState } from "@/hooks/use-queryobject";

import { RequireRunning } from "@/components/RequireLegacy";
import FocusIconButton from "@/components/FocusIconButton";
import PageContainer from "@/components/PageContainer";
import ObservableDataGrid, {
  ObservableDataGridColumnDef,
  aspectsPresenceColumnDef,
  aspectsObservableColumnDef,
  aspectsPresenceFilter,
  descriptionColumnDef,
  iconColumnDef,
  labelColumnDef,
  locationColumnDef,
  multiselectOptionsFilter,
  aspectsColumnDef,
  aspectsFilter,
} from "@/components/ObservableDataGrid";
import CraftIconButton from "@/components/CraftIconButton";
import PinIconButton from "@/components/PinIconButton";

interface BookModel
  extends ModelWithAspects,
    ModelWithDescription,
    ModelWithIconUrl,
    ModelWithLabel,
    ModelWithParentTerrain {
  id: string;
  memoryLabel$: Observable<string | null>;
  memoryAspects$: Observable<Aspects>;
  focus(): void;
  read(): void;
  pin(): void;
}

function elementStackToBook(
  elementStack: ElementStackModel,
  compendium: Compendium,
  orchestrator: Orchestrator,
  pinboard: Pinboard
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
        return Null$;
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
    mergeMapIfNotNull((memory) => memory.label$),
    map((label) => (label?.startsWith("Memory: ") ? label.substring(8) : label))
  );

  const memoryAspects$ = memory$.pipe(
    mergeMap((memory) =>
      observableObjectOrEmpty(memory?.aspects$).pipe(
        map((aspects) => pick(aspects, powerAspects))
      )
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
    read: () => {
      const mystery = extractMysteryAspect(elementStack.aspects);
      const isMastered = Object.keys(elementStack.aspects).some((aspectId) =>
        aspectId.startsWith("mastery.")
      );
      orchestrator.requestOrchestration({
        recipeId: isMastered
          ? `study.mystery.${mystery}.mastered`
          : `study.mystery.${mystery}.mastering.begin`,
        desiredElementIds: [elementStack.elementId],
      });
    },
    pin: async () => {
      const memory = await firstValueFrom(memory$);
      if (!memory) {
        return;
      }

      const mystery = extractMysteryAspect(elementStack.aspects);
      const isMastered = Object.keys(elementStack.aspects).some((aspectId) =>
        aspectId.startsWith("mastery.")
      );

      pinboard.pin({
        elementId: memory.id,
        produce: {
          recipeId: isMastered
            ? `study.mystery.${mystery}.mastered`
            : `study.mystery.${mystery}.mastering.begin`,
          desiredElementIds: [elementStack.elementId],
        },
      });
    },
  };
}

function extractMysteryAspect(aspects: Aspects): string | null {
  let mystery = Object.keys(aspects).find((aspectId) =>
    aspectId.startsWith("mystery.")
  );
  if (!mystery) {
    return null;
  }

  return mystery.substring(8);
}

const BookCatalogPage = () => {
  const model = useDIDependency(GameModel);
  const compendium = useDIDependency(Compendium);
  const orchestrator = useDIDependency(Orchestrator);
  const pinboard = useDIDependency(Pinboard);

  const items$ = React.useMemo(
    () =>
      model.visibleElementStacks$.pipe(
        filterHasAspect("readable"),
        mapArrayItemsCached((item) =>
          elementStackToBook(item, compendium, orchestrator, pinboard)
        )
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
        field: "$item",
        renderCell: ({ value }) => (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <FocusIconButton onClick={() => value.focus()} />
            <CraftIconButton onClick={() => value.read()} />
          </Box>
        ),
      } as ObservableDataGridColumnDef<BookModel>,
      iconColumnDef<BookModel>(),
      labelColumnDef<BookModel>(),
      locationColumnDef<BookModel>({
        filter: multiselectOptionsFilter("location", locations),
      }),
      aspectsColumnDef<BookModel>(
        (aspectId) => aspectId.startsWith("mystery."),
        {
          headerName: "Mystery",
          filter: aspectsFilter("mystery", "auto"),
          width: 150,
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
          filter: aspectsPresenceFilter("mastered", "auto"),
        }
      ),
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
            <PinIconButton title="Pin Memory" onClick={() => value.pin()} />
          </Box>
        ),
      } as ObservableDataGridColumnDef<BookModel>,
      {
        headerName: "Memory",
        width: 150,
        observable: "memoryLabel$",
        sortable: true,
      },
      aspectsObservableColumnDef<BookModel>(
        "memoryAspects",
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
        {
          headerName: "Language",
          width: 125,
          filter: aspectsFilter("language", "auto"),
        }
      ),
      aspectsPresenceColumnDef<BookModel>(
        ["film", "record.phonograph"],
        { display: "none" },
        {
          headerName: "Type",
          width: 125,
          filter: aspectsFilter("type", ["film", "record.phonograph"]),
        }
      ),
      aspectsPresenceColumnDef<BookModel>(
        (aspectId) => aspectId.startsWith("contamination."),
        { display: "none" },
        {
          headerName: "Contamination",
          width: 200,
          filter: aspectsFilter("contamination", "auto"),
        }
      ),
      descriptionColumnDef<BookModel>(),
    ],
    [locations]
  );

  const [filter, onFiltersChanged] = useQueryObjectState();

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
          filters={filter}
          onFiltersChanged={onFiltersChanged}
        />
      </Box>
    </PageContainer>
  );
};

export default BookCatalogPage;
