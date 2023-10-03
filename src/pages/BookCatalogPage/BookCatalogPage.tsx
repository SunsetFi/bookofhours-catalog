import * as React from "react";

import Box from "@mui/material/Box";

import { useQueryObjectState } from "@/hooks/use-queryobject";

import { RequireRunning } from "@/components/RequireLegacy";
import PageContainer from "@/components/PageContainer";
import ObservableDataGrid, {
  ObservableDataGridColumnDef,
  descriptionColumnDef,
  iconColumnDef,
  labelColumnDef,
  locationColumnDef,
} from "@/components/ObservableDataGrid";

import { bookCommandsColumn } from "./columns/book-commands";
import { mysteryColumn } from "./columns/mystery";
import { masteryColumn } from "./columns/mastery";
import { memoryCommandsColumn } from "./columns/memory-commands";
import { memoryIconColumn } from "./columns/memory-icon";
import { memoryLabelColumn } from "./columns/memory-label";
import { memoryAspectsColumn } from "./columns/memory-aspects";
import { languageColumn } from "./columns/language";
import { typeColumn } from "./columns/type";
import { contaminationColumn } from "./columns/contamination";

import { BookModel, useBooks } from "./BookDataSource";

const BookCatalogPage = () => {
  const items$ = useBooks();

  const columns = React.useMemo<ObservableDataGridColumnDef<BookModel>[]>(
    () => [
      bookCommandsColumn(),
      iconColumnDef<BookModel>(),
      labelColumnDef<BookModel>(),
      locationColumnDef<BookModel>(),
      mysteryColumn(),
      masteryColumn(),
      memoryCommandsColumn(),
      memoryIconColumn(),
      memoryLabelColumn(),
      memoryAspectsColumn(),
      languageColumn(),
      typeColumn(),
      contaminationColumn(),
      descriptionColumnDef<BookModel>(),
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
