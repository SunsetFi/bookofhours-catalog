import * as React from "react";

import Box from "@mui/material/Box";

import { useDIDependency } from "@/container";

import { powerAspects } from "@/aspects";

import {
  ElementStackModel,
  TokensSource,
  filterHasAnyAspect,
} from "@/services/sh-game";

import { useQueryObjectState } from "@/hooks/use-queryobject";

import { RequireRunning } from "@/components/RequireLegacy";

import ObservableDataGrid, {
  ObservableDataGridColumnDef,
  aspectsColumnDef,
  aspectsPresenceColumnDef,
  descriptionColumnDef,
  iconColumnDef,
  labelColumnDef,
  locationColumnDef,
} from "@/components/ObservableDataGrid";
import PageContainer from "@/components/PageContainer";
import FocusIconButton from "@/components/FocusIconButton";

const ToolsCatalogPage = () => {
  const tokensSource = useDIDependency(TokensSource);

  const elements$ = React.useMemo(
    () => tokensSource.visibleElementStacks$.pipe(filterHasAnyAspect("tool")),
    [tokensSource]
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
            <FocusIconButton token={value} />
          </Box>
        ),
      } as ObservableDataGridColumnDef<ElementStackModel>,
      iconColumnDef<ElementStackModel>(),
      labelColumnDef<ElementStackModel>(),
      locationColumnDef<ElementStackModel>(),
      aspectsColumnDef<ElementStackModel>(powerAspects),
      aspectsPresenceColumnDef<ElementStackModel>(
        ["device"],
        { display: "none" },
        { headerName: "Consumable", width: 200 }
      ),
      descriptionColumnDef<ElementStackModel>(),
    ],
    []
  );

  const [filters, onFiltersChanged] = useQueryObjectState();

  return (
    <PageContainer title="Toolshed" backTo="/">
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

export default ToolsCatalogPage;
