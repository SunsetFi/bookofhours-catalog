import React from "react";

import { Box, Stack } from "@mui/material";

import { powerAspects } from "@/aspects";
import { useObservation } from "@/hooks/use-observation";

import FocusIconButton from "@/components/FocusIconButton";
import OrchestrationIconButton from "@/components/OrchestrationIconButton";
import PinElementIconButton from "@/components/PinElementIconButton";
import {
  ElementIconCell,
  createElementStackColumnHelper,
} from "@/components/ObservableDataGrid";
import DataGridPage from "@/components/DataGridPage";

import { BookModel, useBooks } from "./books-data-source";

const columnHelper = createElementStackColumnHelper<BookModel>();

const columns = [
  columnHelper.display({
    id: "book-commands",
    size: 50,
    cell: (props) => {
      return (
        <Stack direction="column" alignItems="center">
          <FocusIconButton token={props.row.original} />
          <OrchestrationIconButton
            interactivity="full"
            onClick={() => props.row.original.read()}
          />
        </Stack>
      );
    },
  }),
  columnHelper.elementStackIcon("Book Icon"),
  columnHelper.label(),
  columnHelper.location(),
  columnHelper.aspectsList("period", (s) => s.startsWith("period."), {
    size: 125,
    header: "Period",
    showLevel: false,
    enableSorting: false,
  }),
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
    meta: {
      columnName: "Pin Memory",
    },
    cell: (props) => {
      const memoryElementId = useObservation(
        props.row.original.memoryElementId$,
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
    meta: {
      columnName: "Memory Icon",
    },
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
];

const BookCatalogPage = () => {
  const items$ = useBooks();

  return (
    <DataGridPage
      title="Bibliographical Collection"
      columns={columns}
      items$={items$}
    />
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
