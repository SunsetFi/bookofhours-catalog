import * as React from "react";

import Box from "@mui/material/Box";

import { useObservation } from "@/observables";

import { useQueryObjectState } from "@/hooks/use-queryobject";

import { RequireRunning } from "@/components/RequireLegacy";
import PageContainer from "@/components/PageContainer";
import FocusIconButton from "@/components/FocusIconButton";
import CraftIconButton from "@/components/CraftIconButton";
import PinElementIconButton from "@/components/PinElementIconButton";
import ObservableDataGrid, {
  createElementStackColumnHelper,
} from "@/components/ObservableDataGrid2";

import { BookModel, useBooks } from "./books-data-source";
import ElementIconCell from "@/components/ObservableDataGrid2/cells/ElementIconCell";
import TextWrapCell from "@/components/ObservableDataGrid2/cells/TextWrapCell";
import { powerAspects } from "@/aspects";

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
      columnHelper.elementIcon(),
      columnHelper.label(),
      columnHelper.location(),
      columnHelper.aspectsList("mystery", (s) => s.startsWith("mystery."), {
        header: "Mystery",
        size: 175,
      }),
      columnHelper.aspectsList("mastery", (s) => s.startsWith("mastery."), {
        header: "Mastery",
        size: 175,
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
        cell: ElementIconCell,
      }),
      columnHelper.observe("memoryLabel$", {
        id: "memory",
        header: "Memory",
        size: 200,
        cell: TextWrapCell,
      }),
      columnHelper.aspectsList("memory-aspects", powerAspects, {
        header: "Memory Aspects",
        size: 275,
        aspectsSource: (model) => model.memoryAspects$,
      }),
      columnHelper.aspectsList("language", (s) => s.startsWith("w."), {
        header: "Language",
        size: 175,
        showLevel: false,
      }),
      columnHelper.aspectsList("type", ["film", "record.phonograph"], {
        header: "Type",
        size: 150,
        showLevel: false,
      }),
      columnHelper.aspectsList(
        "contamination",
        (s) => s.startsWith("contamination."),
        {
          header: "Contamination",
          size: 250,
          showLevel: false,
        }
      ),
      columnHelper.description(),
    ],
    []
  );

  const [filter, onFiltersChanged] = useQueryObjectState();

  return (
    <PageContainer title="Bibliographical Collection" backTo="/">
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
          items$={items$}
          filters={filter}
          onFiltersChanged={onFiltersChanged}
        />
      </Box>
    </PageContainer>
  );
};

export default BookCatalogPage;
