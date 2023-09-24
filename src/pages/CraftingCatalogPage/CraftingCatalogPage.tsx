import * as React from "react";
import { first, mapValues } from "lodash";
import {
  Observable,
  map,
  mergeMap,
  shareReplay,
  BehaviorSubject,
  tap,
  of,
} from "rxjs";
import { Aspects } from "secrethistories-api";

import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import CraftIcon from "@mui/icons-material/Settings";

import { useDIDependency } from "@/container";

import { mapArrayItemsCached } from "@/observables";

import { Compendium, RecipeModel } from "@/services/sh-compendium";
import { GameModel } from "@/services/sh-game";

import { useQueryObjectState } from "@/hooks/use-queryobject";

import PageContainer from "@/components/PageContainer";
import { RequireRunning } from "@/components/RequireLegacy";
import ObservableDataGrid, {
  ObservableDataGridColumnDef,
  aspectsColumnDef,
  aspectsObservableColumnDef,
  textColumnDef,
} from "@/components/ObservableDataGrid";
import { Orchestrator } from "@/services/sh-game/orchestration";

interface CraftableModel {
  id: string;
  iconUrl$: Observable<string | null>;
  label$: Observable<string | null>;
  aspects$: Observable<Readonly<Aspects>>;
  skillIconUrl$: Observable<string | null>;
  skillLabel$: Observable<string | null>;
  requirements$: Observable<Readonly<Aspects>>;
  recipeDescription$: Observable<string | null>;
  craft(): void;
}

const nullStringObservable = new BehaviorSubject<string | null>(null);
const nullAspectsObservable = new BehaviorSubject<Aspects>({});

function recipeToCraftableModel(
  recipeModel: RecipeModel,
  compendium: Compendium,
  orchestrator: Orchestrator
): CraftableModel {
  const craftable$ = recipeModel.effects$.pipe(
    map((effects) =>
      first(Object.keys(effects).filter((x) => Number(effects[x]) > 0))
    ),
    map((elementId) =>
      elementId ? compendium.getElementById(elementId) : null
    ),
    tap((x) => {
      if (!x) {
        console.warn(`Recipe ${recipeModel.id} has no craftable element.`);
      }
    }),
    shareReplay(1)
  );

  const skill$ = recipeModel.requirements$.pipe(
    map((reqs) => Object.keys(reqs).find((req) => req.startsWith("s."))),
    map((elementId) =>
      elementId ? compendium.getElementById(elementId) : null
    )
  );

  return {
    id: recipeModel.id,
    iconUrl$: craftable$.pipe(map((element) => element?.iconUrl ?? null)),
    label$: craftable$.pipe(
      mergeMap((element) => element?.label$ ?? nullStringObservable)
    ),
    aspects$: craftable$.pipe(
      mergeMap((element) => element?.aspects$ ?? nullAspectsObservable)
    ),
    skillIconUrl$: skill$.pipe(map((element) => element?.iconUrl ?? null)),
    skillLabel$: skill$.pipe(
      mergeMap((element) => element?.label$ ?? nullStringObservable)
    ),
    requirements$: recipeModel.requirements$.pipe(
      map((x) => mapValues(x, Number))
    ),
    recipeDescription$: recipeModel.startDescription$,
    craft: () => orchestrator.beginRecipeOrchestration(recipeModel.id),
  };
}

const CraftingCatalogPage = () => {
  const compendium = useDIDependency(Compendium);
  const model = useDIDependency(GameModel);
  const orchestrator = useDIDependency(Orchestrator);

  const elements$ = React.useMemo(
    () =>
      model.unlockedRecipes$.pipe(
        mapArrayItemsCached((item) =>
          recipeToCraftableModel(item, compendium, orchestrator)
        )
      ),
    [model, compendium, orchestrator]
  );

  const columns = React.useMemo(
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
            <IconButton onClick={() => value.craft()}>
              <CraftIcon />
            </IconButton>
          </Box>
        ),
      } as ObservableDataGridColumnDef<CraftableModel>,
      {
        headerName: "",
        width: 90,
        renderCell: ({ value }: { value: any }) => (
          <Box
            sx={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              p: 2,
            }}
          >
            <img src={value} style={{ maxWidth: "75px", maxHeight: "75px" }} />
          </Box>
        ),
        observable: "iconUrl$",
      } as ObservableDataGridColumnDef<CraftableModel>,
      textColumnDef<CraftableModel>("Item", "item", "label$", { width: 250 }),
      // FIXME: Only show non-hidden aspects.
      aspectsColumnDef<CraftableModel>(filterCraftableAspect, {
        width: 300,
      }),
      {
        headerName: "",
        width: 90,
        renderCell: ({ value }: { value: any }) => (
          <Box
            sx={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              p: 2,
            }}
          >
            <img src={value} style={{ maxWidth: "75px", maxHeight: "75px" }} />
          </Box>
        ),
        observable: "skillIconUrl$",
      } as ObservableDataGridColumnDef<CraftableModel>,
      textColumnDef<CraftableModel>("Skill", "skill", "skillLabel$", {
        width: 250,
      }),
      aspectsObservableColumnDef<CraftableModel>(
        "requirements",
        (value) => value.requirements$,
        (x) => x != "ability",
        {
          headerName: "Requirements",
          width: 100,
        }
      ),
      textColumnDef<CraftableModel>(
        "Description",
        "description",
        "recipeDescription$",
        {
          flex: 1,
        }
      ),
    ],
    []
  );

  const [filters, onFiltersChanged] = useQueryObjectState();

  return (
    <PageContainer title="The Fruits of Knowledge" backTo="/">
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
          items$={elements$}
          filters={filters}
          onFiltersChanged={onFiltersChanged}
        />
      </Box>
    </PageContainer>
  );
};

function filterCraftableAspect(aspect: string) {
  if (aspect.startsWith("boost.")) {
    return false;
  }

  if (aspect === "considerable" || aspect === "thing") {
    return false;
  }

  return true;
}

export default CraftingCatalogPage;
