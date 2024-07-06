import React from "react";

import Box from "@mui/material/Box";

import { useDIDependency } from "@/container";

import { furnishingAspects, powerAspects } from "@/aspects";

import { TokensSource, filterHasAnyAspect } from "@/services/sh-game";

import FocusIconButton from "@/components/FocusIconButton";
import PageContainer from "@/components/PageContainer";
import {
  IdentifierItemDataGrid,
  createElementStackColumnHelper,
  useQuerySettings,
} from "@/components/ObservableDataGrid";

const columnHelper = createElementStackColumnHelper();

const FurnishingsCatalogPage = () => {
  const tokensSource = useDIDependency(TokensSource);

  const elements$ = React.useMemo(
    () =>
      tokensSource.visibleElementStacks$.pipe(
        filterHasAnyAspect(furnishingAspects)
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
        size: 175,
      }),
      columnHelper.aspectsList("type", furnishingAspects, {
        header: "Type",
        size: 175,
        showLevel: false,
      }),
      columnHelper.description(),
    ],
    []
  );

  const settings = useQuerySettings();

  return (
    <PageContainer title="An Accounting of the Walls and Floors">
      <IdentifierItemDataGrid
        sx={{ height: "100%" }}
        columns={columns}
        items$={elements$}
        {...settings}
      />
    </PageContainer>
  );
};

export default FurnishingsCatalogPage;
