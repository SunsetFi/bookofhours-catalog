import React from "react";

import Box from "@mui/material/Box";

import { useDIDependency } from "@/container";

import { powerAspects } from "@/aspects";

import { TokensSource, filterHasAnyAspect } from "@/services/sh-game";

import { useQueryObjectState } from "@/hooks/use-queryobject";

import { RequireRunning } from "@/components/RequireLegacy";

import PageContainer from "@/components/PageContainer";
import FocusIconButton from "@/components/FocusIconButton";
import ObservableDataGrid, {
  createElementStackColumnHelper,
} from "@/components/ObservableDataGrid";

const columnHelper = createElementStackColumnHelper();

const ThingsCatalogPage = () => {
  const tokensSource = useDIDependency(TokensSource);

  const elements$ = React.useMemo(
    () => tokensSource.visibleElementStacks$.pipe(filterHasAnyAspect("thing")),
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
      columnHelper.aspectsList("power-aspects", powerAspects, {
        size: 300,
      }),
      columnHelper.description(),
    ],
    []
  );

  const [filters, onFiltersChanged] = useQueryObjectState();

  return (
    <PageContainer title="Antiquities and Knicknacks" backTo="/">
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

export default ThingsCatalogPage;
