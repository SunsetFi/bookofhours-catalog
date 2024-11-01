import React from "react";

import Box from "@mui/material/Box";

import { useDIDependency } from "@/container";

import { courseAspects, powerAspects, provisionsAspects } from "@/aspects";

import { TokensSource, filterHasAnyAspect } from "@/services/sh-game";

import FocusIconButton from "@/components/FocusIconButton";
import { createElementStackColumnHelper } from "@/components/ObservableDataGrid";
import DataGridPage from "@/components/DataGridPage";

const columnHelper = createElementStackColumnHelper();

const ProvisionsCatalog = () => {
  const tokensSource = useDIDependency(TokensSource);

  const elements$ = React.useMemo(
    () =>
      tokensSource.visibleElementStacks$.pipe(
        filterHasAnyAspect(provisionsAspects)
      ),
    [tokensSource]
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
      columnHelper.aspectsList("type", provisionsAspects, {
        header: "Type",
        size: 150,
        showLevel: false,
      }),
      // TODO: Only show if DLC is enabled
      columnHelper.aspectsList("course", courseAspects, {
        header: "Course",
        size: 150,
        showLevel: false,
      }),
      columnHelper.aspectsList("power-aspects", powerAspects, {
        size: 300,
      }),
      columnHelper.description(),
    ],
    []
  );

  return (
    <DataGridPage
      title="Stores and Provisions"
      columns={columns}
      items$={elements$}
    />
  );
};

export default ProvisionsCatalog;
