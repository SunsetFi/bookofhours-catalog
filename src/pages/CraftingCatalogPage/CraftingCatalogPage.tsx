import * as React from "react";
import { map } from "rxjs";
import { pickBy } from "lodash";

import Box from "@mui/material/Box";

import { useQueryObjectState } from "@/hooks/use-queryobject";

import PageContainer from "@/components/PageContainer";
import { RequireRunning } from "@/components/RequireLegacy";
import PinRecipeIconButton from "@/components/PinRecipeIconButton";
import CraftIconButton from "@/components/CraftIconButton";
import ObservableDataGrid, {
  ElementIconCell,
  TextWrapCell,
  AspectsListCell,
  createObservableColumnHelper,
} from "@/components/ObservableDataGrid";

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
              <CraftIconButton onClick={() => props.row.original.craft()} />
            </Box>
          );
        },
      }),
      columnHelper.observe("elementId$", {
        id: "icon",
        header: "",
        size: 75,
        enableColumnFilter: false,
        enableSorting: false,
        cell: ElementIconCell,
      }),
      columnHelper.observe("label$", {
        id: "label",
        header: "Name",
        size: 120,
        cell: TextWrapCell,
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
          cell: AspectsListCell,
        }
      ),
      columnHelper.observe("skillElementId$", {
        id: "skill_icon",
        header: "",
        size: 75,
        enableColumnFilter: false,
        enableSorting: false,
        cell: ElementIconCell,
      }),
      columnHelper.observe("skillLabel$", {
        id: "skill",
        header: "Skill",
        size: 200,
        cell: TextWrapCell,
      }),
      columnHelper.observe("requirements$", {
        id: "requirements",
        header: "Requirements",
        size: 200,
        cell: AspectsListCell,
      }),
      columnHelper.observe("description$", {
        id: "description",
        header: "Description",
        size: 300,
        cell: TextWrapCell,
      }),
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
          items$={craftables$}
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
