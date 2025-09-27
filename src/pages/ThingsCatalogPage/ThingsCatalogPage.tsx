import React from "react";

import Box from "@mui/material/Box";

import { useDIDependency } from "@/container";

import { powerAspects } from "@/aspects";

import {
  TokensSource,
  filterHasAnyAspect,
  filterHasNoneOfAspect,
} from "@/services/sh-game";

import FocusIconButton from "@/components/FocusIconButton";
import { createElementStackColumnHelper } from "@/components/ObservableDataGrid";
import DataGridPage from "@/components/DataGridPage";

const columnHelper = createElementStackColumnHelper();

const ThingsCatalogPage = () => {
  const tokensSource = useDIDependency(TokensSource);

  const elements$ = React.useMemo(
    () =>
      tokensSource.visibleElementStacks$.pipe(
        filterHasAnyAspect("thing"),
        filterHasNoneOfAspect("readable"),
      ),
    [tokensSource],
  );

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
      columnHelper.elementStackIcon(),
      columnHelper.label(),
      columnHelper.location(),
      columnHelper.aspectsList("power-aspects", powerAspects, {
        size: 300,
      }),
      columnHelper.description(),
    ],
    [],
  );

  return (
    <DataGridPage
      title="Antiquities and Knicknacks"
      columns={columns}
      items$={elements$}
    />
  );
};

export default ThingsCatalogPage;
