import {
  aspectsPresenceColumnDef,
  aspectsPresenceFilter,
} from "@/components/ObservableDataGrid";

import { BookModel } from "../BookDataSource";

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
