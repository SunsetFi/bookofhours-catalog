import React from "react";

import Box from "@mui/material/Box";

import { useDIDependency } from "@/container";

import { SituationModel, TokensSource } from "@/services/sh-game";

import PageContainer from "@/components/PageContainer";
import FocusIconButton from "@/components/FocusIconButton";
import {
  IdentifierItemDataGrid,
  createSituationColumnHelper,
  useQuerySettings,
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

  const settings = useQuerySettings();

  return (
    <PageContainer title="Gardens and Glades">
      <IdentifierItemDataGrid
        sx={{ height: "100%" }}
        columns={columns}
        items$={tokensSource.unlockedHarvestStations$}
        {...settings}
      />
    </PageContainer>
  );
};

export default HarvestCatalogPage;
