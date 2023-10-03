import * as React from "react";

import Box from "@mui/material/Box";

import { useQueryObjectState } from "@/hooks/use-queryobject";

import PageContainer from "@/components/PageContainer";
import { RequireRunning } from "@/components/RequireLegacy";
import ObservableDataGrid, {
  aspectsColumnDef,
  aspectsObservableColumnDef,
  descriptionColumnDef,
  labelColumnDef,
  textColumnDef,
} from "@/components/ObservableDataGrid";

import { CraftableModel, useCraftables } from "./crafting-data-source";
import { craftableCommandsColumn } from "./columns/craftable-commands";
import { craftableIconColumn } from "./columns/craftable-icon";
import { skillIconColumn } from "./columns/skill-icon";

const CraftingCatalogPage = () => {
  const craftables$ = useCraftables();

  const columns = React.useMemo(
    () => [
      craftableCommandsColumn(),
      craftableIconColumn(),
      labelColumnDef<CraftableModel>({ width: 200 }),
      aspectsColumnDef<CraftableModel>(filterCraftableAspect, {
        width: 300,
      }),
      skillIconColumn(),
      textColumnDef<CraftableModel>("Skill", "skill", "skillLabel$", {
        width: 200,
      }),
      aspectsObservableColumnDef<CraftableModel>(
        "requirements",
        (value) => value.requirements$,
        (x) => x != "ability",
        {
          headerName: "Requirements",
          width: 200,
        }
      ),
      descriptionColumnDef<CraftableModel>(),
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
