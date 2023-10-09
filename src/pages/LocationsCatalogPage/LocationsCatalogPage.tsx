import * as React from "react";

import Box from "@mui/material/Box";

import { useDIDependency } from "@/container";

import { ConnectedTerrainModel, TokensSource } from "@/services/sh-game";

import { useQueryObjectState } from "@/hooks/use-queryobject";

import PageContainer from "@/components/PageContainer";
import { RequireRunning } from "@/components/RequireLegacy";
import ObservableDataGrid, {
  TextWrapCell,
  createObservableColumnHelper,
} from "@/components/ObservableDataGrid";

const columnHelper = createObservableColumnHelper<ConnectedTerrainModel>();

const LocationsCatalogPage = () => {
  const tokensSource = useDIDependency(TokensSource);
  const items$ = tokensSource.unsealedTerrains$;

  const columns = React.useMemo(
    () => [
      columnHelper.observe("label$", {
        header: "Location",
        filterFn: "includesString",
        cell: TextWrapCell,
      }),
      columnHelper.observe("shrouded$", {
        header: "Shrouded",
      }),
    ],
    []
  );

  const [filters, onFiltersChanged] = useQueryObjectState();

  return (
    <PageContainer title="Locations" backTo="/">
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
          filters={filters}
          onFiltersChanged={onFiltersChanged}
        />
      </Box>
    </PageContainer>
  );
};

export default LocationsCatalogPage;
