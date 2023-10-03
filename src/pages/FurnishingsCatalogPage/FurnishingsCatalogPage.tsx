import * as React from "react";

import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";

import VisibilityIcon from "@mui/icons-material/Visibility";

import { useDIDependency } from "@/container";

import { furnishingAspects, powerAspects } from "@/aspects";

import {
  ElementStackModel,
  TokensSource,
  filterHasAspect,
} from "@/services/sh-game";

import { useQueryObjectState } from "@/hooks/use-queryobject";

import { RequireRunning } from "@/components/RequireLegacy";

import ObservableDataGrid, {
  ObservableDataGridColumnDef,
  aspectsColumnDef,
  aspectsPresenceColumnDef,
  aspectsPresenceFilter,
  descriptionColumnDef,
  iconColumnDef,
  labelColumnDef,
  locationColumnDef,
} from "@/components/ObservableDataGrid";
import PageContainer from "@/components/PageContainer";

const FurnishingsCatalogPage = () => {
  const tokensSource = useDIDependency(TokensSource);

  const elements$ = React.useMemo(
    () =>
      tokensSource.visibleElementStacks$.pipe(
        filterHasAspect(furnishingAspects)
      ),
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
            <IconButton onClick={() => value.focus()}>
              <VisibilityIcon />
            </IconButton>
          </Box>
        ),
      } as ObservableDataGridColumnDef<ElementStackModel>,
      iconColumnDef<ElementStackModel>(),
      labelColumnDef<ElementStackModel>(),
      locationColumnDef<ElementStackModel>(),
      aspectsColumnDef<ElementStackModel>(powerAspects),
      aspectsPresenceColumnDef<ElementStackModel>(
        furnishingAspects,
        { display: "none" },
        {
          headerName: "Type",
          width: 150,
          filter: aspectsPresenceFilter("type", furnishingAspects),
        }
      ),
      descriptionColumnDef<ElementStackModel>(),
    ],
    []
  );

  const [filters, onFiltersChanged] = useQueryObjectState();

  return (
    <PageContainer title="An Accounting of the Walls and Floors" backTo="/">
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

export default FurnishingsCatalogPage;
