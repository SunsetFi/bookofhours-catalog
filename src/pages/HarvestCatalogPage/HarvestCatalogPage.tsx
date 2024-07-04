import React from "react";

import Box from "@mui/material/Box";

import { useDIDependency } from "@/container";

import { SituationModel, TokensSource } from "@/services/sh-game";

import { useQueryObjectState } from "@/hooks/use-queryobject";

import PageContainer from "@/components/PageContainer";
import FocusIconButton from "@/components/FocusIconButton";
import {
  IdentifierItemDataGrid,
  createSituationColumnHelper,
  useQuerySort,
} from "@/components/ObservableDataGrid";

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
  const [sortState, onSortingChanged] = useQuerySort();

  return (
    <PageContainer title="Gardens and Glades">
      <IdentifierItemDataGrid
        sx={{ height: "100%" }}
        columns={columns}
        items$={tokensSource.unlockedHarvestStations$}
        filters={filters}
        sorting={sortState}
        onSortingChanged={onSortingChanged}
        onFiltersChanged={onFiltersChanged}
      />
    </PageContainer>
  );
};

export default HarvestCatalogPage;
