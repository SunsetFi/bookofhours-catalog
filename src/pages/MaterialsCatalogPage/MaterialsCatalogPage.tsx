import React from "react";

import Box from "@mui/material/Box";

import { useDIDependency } from "@/container";

import { materialAspects, powerAspects } from "@/aspects";

import { TokensSource, filterHasAnyAspect } from "@/services/sh-game";

import FocusIconButton from "@/components/FocusIconButton";
import { createElementStackColumnHelper } from "@/components/ObservableDataGrid";
import DataGridPage from "@/components/DataGridPage";

const columnHelper = createElementStackColumnHelper();

const MaterialsCatalogPage = () => {
  const tokensSource = useDIDependency(TokensSource);

  const elements$ = React.useMemo(
    // Much more than just materials.  This is whatever I find useful to Make Things With
    () =>
      tokensSource.visibleElementStacks$.pipe(
        filterHasAnyAspect(materialAspects),
      ),
    [tokensSource],
  );

  const columns = React.useMemo(
    () => [
      columnHelper.display({
        id: "focus-button",
        header: "",
        size: 50,
        meta: {
          columnName: "Focus",
        },
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
      columnHelper.aspectsList("material", materialAspects, {
        header: "Type",
        size: 175,
        showLevel: false,
      }),
      columnHelper.description(),
    ],
    [],
  );

  return (
    <DataGridPage title="Malleary Shelf" columns={columns} items$={elements$} />
  );
};

export default MaterialsCatalogPage;
