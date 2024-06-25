import React from "react";

import Box from "@mui/material/Box";

import { useDIDependency } from "@/container";

import { powerAspects, provisionsAspects } from "@/aspects";

import { useQueryObjectState } from "@/hooks/use-queryobject";

import { TokensSource, filterHasAnyAspect } from "@/services/sh-game";

import { RequireActiveLegacy } from "@/components/RequireActiveLegacy";
import PageContainer from "@/components/PageContainer";
import FocusIconButton from "@/components/FocusIconButton";
import {
  IdentifierItemDataGrid,
  createElementStackColumnHelper,
} from "@/components/ObservableDataGrid";

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
        size: 200,
        showLevel: false,
      }),
      columnHelper.aspectsList("power-aspects", powerAspects, {
        size: 300,
      }),
      columnHelper.description(),
    ],
    []
  );

  const [filter, onFiltersChanged] = useQueryObjectState();

  return (
    <PageContainer title="Stores and Provisions">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
        }}
      >
        <RequireActiveLegacy />
        <IdentifierItemDataGrid
          sx={{ height: "100%" }}
          columns={columns}
          items$={elements$}
          filters={filter}
          onFiltersChanged={onFiltersChanged}
        />
      </Box>
    </PageContainer>
  );
};

export default ProvisionsCatalog;
