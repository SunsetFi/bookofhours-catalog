import React from "react";

import Box from "@mui/material/Box";

import { useDIDependency } from "@/container";

import { TokensSource } from "@/services/sh-game";

import FocusIconButton from "@/components/FocusIconButton";
import { createSituationColumnHelper } from "@/components/ObservableDataGrid";
import DataGridPage from "@/components/DataGridPage";

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
    [],
  );

  return (
    <DataGridPage
      title="Gardens and Glades"
      columns={columns}
      items$={tokensSource.unlockedHarvestStations$}
    />
  );
};

export default HarvestCatalogPage;
