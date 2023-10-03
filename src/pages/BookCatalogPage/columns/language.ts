import {
  aspectsFilter,
  aspectsPresenceColumnDef,
} from "@/components/ObservableDataGrid";

import { BookModel } from "../BookDataSource";

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
