import React from "react";

import Box from "@mui/material/Box";

import { useDIDependency } from "@/container";

import { materialAspects, powerAspects } from "@/aspects";

import { TokensSource, filterHasAnyAspect } from "@/services/sh-game";

import { useQueryObjectState } from "@/hooks/use-queryobject";

import PageContainer from "@/components/PageContainer";
import FocusIconButton from "@/components/FocusIconButton";
import {
  IdentifierItemDataGrid,
  createElementStackColumnHelper,
  useQuerySort,
} from "@/components/ObservableDataGrid";

const columnHelper = createElementStackColumnHelper();

const MaterialsCatalogPage = () => {
  const tokensSource = useDIDependency(TokensSource);

  const elements$ = React.useMemo(
    // Much more than just materials.  This is whatever I find useful to Make Things With
    () =>
      tokensSource.visibleElementStacks$.pipe(
        filterHasAnyAspect(materialAspects)
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
    []
  );

  const [filters, onFiltersChanged] = useQueryObjectState();
  const [sortState, onSortingChanged] = useQuerySort();

  return (
    <PageContainer title="Malleary Shelf">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
        }}
      >
        <IdentifierItemDataGrid
          sx={{ height: "100%" }}
          columns={columns}
          items$={elements$}
          filters={filters}
          sorting={sortState}
          onSortingChanged={onSortingChanged}
          onFiltersChanged={onFiltersChanged}
        />
      </Box>
    </PageContainer>
  );
};

export default MaterialsCatalogPage;
