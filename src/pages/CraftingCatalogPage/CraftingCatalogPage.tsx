import React from "react";
import { map } from "rxjs";
import { pickBy } from "lodash";

import Box from "@mui/material/Box";

import { aspectsMagnitude } from "@/aspects";

import PinRecipeIconButton from "@/components/PinRecipeIconButton";
import OrchestrationIconButton from "@/components/OrchestrationIconButton";
import {
  ElementIconCell,
  AspectsListCell,
  createObservableColumnHelper,
  aspectsFilter,
  AspectsFilter,
} from "@/components/ObservableDataGrid";
import DataGridPage from "@/components/DataGridPage";

import { CraftableModel, useCraftables } from "./crafting-data-source";

const columnHelper = createObservableColumnHelper<CraftableModel>();

const CraftingCatalogPage = () => {
  const craftables$ = useCraftables();

  const columns = React.useMemo(
    () => [
      columnHelper.display({
        id: "commands",
        header: "",
        size: 50,
        cell: (props) => {
          return (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <PinRecipeIconButton recipeId={props.row.original.id} />
              <OrchestrationIconButton
                interactivity="full"
                onClick={() => props.row.original.craft()}
              />
            </Box>
          );
        },
      }),
      columnHelper.observe("elementId$", {
        id: "icon",
        header: "",
        size: 75,
        enableSorting: false,
        enableColumnFilter: false,
        cell: ElementIconCell,
      }),
      columnHelper.observeText("label$", {
        id: "label",
        header: "Name",
        rowHeader: true,
        size: 120,
      }),
      columnHelper.observe(
        (item) =>
          item.aspects$.pipe(
            map((aspects) =>
              pickBy(aspects, (_v, k) => filterCraftableAspect(k))
            )
          ),
        {
          id: "aspects",
          header: "Aspects",
          size: 200,
          sortingFn: (a, b, columnId) =>
            aspectsMagnitude(a.getValue(columnId)) -
            aspectsMagnitude(b.getValue(columnId)),
          filterFn: aspectsFilter,
          meta: {
            filterComponent: (props) => (
              <AspectsFilter allowedAspectIds="auto" {...props} />
            ),
          },
          cell: (props) => <AspectsListCell {...props} showLevel />,
        }
      ),
      columnHelper.observe("skillElementId$", {
        id: "skill_icon",
        header: "",
        size: 75,
        enableSorting: false,
        enableColumnFilter: false,
        cell: ElementIconCell,
      }),
      columnHelper.observeText("skillLabel$", {
        id: "skill",
        header: "Skill",
        size: 200,
      }),
      columnHelper.observe("requirements$", {
        id: "requirements",
        header: "Requirements",
        size: 200,
        sortingFn: (a, b, columnId) =>
          aspectsMagnitude(a.getValue(columnId)) -
          aspectsMagnitude(b.getValue(columnId)),
        filterFn: aspectsFilter,
        meta: {
          filterComponent: (props) => (
            <AspectsFilter allowedAspectIds="auto" {...props} />
          ),
        },
        cell: (props) => <AspectsListCell {...props} showLevel />,
      }),
      columnHelper.observeText("description$", {
        id: "description",
        header: "Description",
        size: 300,
      }),
    ],
    []
  );

  return (
    <DataGridPage
      title="The Fruits of Knowledge"
      columns={columns}
      items$={craftables$}
      defaultSortColumn="label"
    />
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
