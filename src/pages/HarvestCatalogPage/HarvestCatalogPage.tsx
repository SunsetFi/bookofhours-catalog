import * as React from "react";

import Box from "@mui/material/Box";

import { useDIDependency } from "@/container";

import { SituationModel, TokensSource } from "@/services/sh-game";

import { useQueryObjectState } from "@/hooks/use-queryobject";

import { RequireRunning } from "@/components/RequireLegacy";
import PageContainer from "@/components/PageContainer";
import FocusIconButton from "@/components/FocusIconButton";
import ObservableDataGrid, {
  createSituationColumnHelper,
} from "@/components/ObservableDataGrid2";

const columnHelper = createSituationColumnHelper();

const HarvestCatalogPage = () => {
  const tokensSource = useDIDependency(TokensSource);

  const columns = React.useMemo(
    () => [
      columnHelper.display({
        id: "focus-button",
        header: "",
        size: 50,
        cell: ({ row }) => (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <FocusIconButton token={row.original} />
          </Box>
        ),
      }),
      columnHelper.label(),
      columnHelper.location(),
      columnHelper.description(),
    ],
    []
  );

  const [filters, onFiltersChanged] = useQueryObjectState();

  return (
    <PageContainer title="Gardens and Glades" backTo="/">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
        }}
      >
        <RequireRunning />
        <ObservableDataGrid
          sx={{ height: "100%" }}
          columns={columns}
          items$={tokensSource.unlockedHarvestStations$}
          filters={filters}
          onFiltersChanged={onFiltersChanged}
        />
      </Box>
    </PageContainer>
  );
};

export default HarvestCatalogPage;
