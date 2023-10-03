import {
  aspectsFilter,
  aspectsPresenceColumnDef,
} from "@/components/ObservableDataGrid";

import { BookModel } from "../books-data-source";

export function languageColumn() {
  return aspectsPresenceColumnDef<BookModel>(
    (aspectId) => aspectId.startsWith("w."),
    { display: "none" },
    {
      headerName: "Language",
      width: 150,
      filter: aspectsFilter("language", "auto"),
    }
  );
}
