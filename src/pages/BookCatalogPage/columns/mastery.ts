import {
  aspectsPresenceColumnDef,
  aspectsPresenceFilter,
} from "@/components/ObservableDataGrid";

import { BookModel } from "../books-data-source";

export function masteryColumn() {
  return aspectsPresenceColumnDef<BookModel>(
    (aspectId) => aspectId.startsWith("mastery."),
    { display: "none" },
    {
      headerName: "Mastered",
      sortable: false,
      width: 125,
      filter: aspectsPresenceFilter("mastered", "auto"),
    }
  );
}
