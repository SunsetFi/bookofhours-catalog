import React from "react";

import Box from "@mui/material/Box";

import { powerAspects } from "@/aspects";
import { useObservation } from "@/hooks/use-observation";

import { useQueryObjectState } from "@/hooks/use-queryobject";

import { RequireActiveLegacy } from "@/components/RequireActiveLegacy";
import PageContainer from "@/components/PageContainer";
import FocusIconButton from "@/components/FocusIconButton";
import CraftIconButton from "@/components/CraftIconButton";
import PinElementIconButton from "@/components/PinElementIconButton";
import {
  IdentifierItemDataGrid,
  ElementIconCell,
  createElementStackColumnHelper,
} from "@/components/ObservableDataGrid";

import { BookModel, useBooks } from "./books-data-source";

const columnHelper = createElementStackColumnHelper<BookModel>();

const BookCatalogPage = () => {
  const items$ = useBooks();

  const columns = React.useMemo(
    () => [
      columnHelper.display({
        id: "book-commands",
        size: 50,
        cell: (props) => {
          return (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <FocusIconButton token={props.row.original} />
              <CraftIconButton onClick={() => props.row.original.read()} />
            </Box>
          );
        },
      }),
      columnHelper.elementStackIcon(),
      columnHelper.label(),
      columnHelper.location(),
      columnHelper.aspectsList("mystery", (s) => s.startsWith("mystery."), {
        header: "Mystery",
        size: 175,
      }),
      columnHelper.aspectsList("mastery", (s) => s.startsWith("mastery."), {
        header: "Mastery",
        size: 125,
        showLevel: false,
        enableSorting: false,
      }),
      columnHelper.aspectsList("attributes", isBookAtributeAspect, {
        header: "Attributes",
        size: 200,
        showLevel: false,
        enableSorting: false,
      }),
      columnHelper.display({
        id: "memory-commands",
        size: 50,
        cell: (props) => {
          const memoryElementId = useObservation(
            props.row.original.memoryElementId$
          );
          return (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              {memoryElementId && (
                <PinElementIconButton elementId={memoryElementId} />
              )}
            </Box>
          );
        },
      }),
      columnHelper.observe("memoryElementId$", {
        id: "memory_icon",
        header: "",
        size: 100,
        enableSorting: false,
        enableColumnFilter: false,
        cell: ElementIconCell,
      }),
      columnHelper.observeText("memoryLabel$", {
        id: "memory",
        header: "Memory",
        size: 160,
      }),
      columnHelper.aspectsList("memory-aspects", powerAspects, {
        header: "Memory Aspects",
        size: 260,
        aspectsSource: (model) => model.memoryAspects$,
      }),
      columnHelper.description(),
    ],
    []
  );

  const [filter, onFiltersChanged] = useQueryObjectState();

  return (
    <PageContainer title="Bibliographical Collection">
      <RequireActiveLegacy />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
        }}
      >
        <IdentifierItemDataGrid
          columns={columns}
          items$={items$}
          filters={filter}
          onFiltersChanged={onFiltersChanged}
        />
      </Box>
    </PageContainer>
  );
};

function isBookAtributeAspect(s: string): boolean {
  if (["film", "record.phonograph"].includes(s)) {
    return true;
  }

  if (s.startsWith("w.")) {
    return true;
  }

  if (s.startsWith("contamination.")) {
    return true;
  }

  return false;
}

export default BookCatalogPage;
