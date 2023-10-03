import {
  aspectsFilter,
  aspectsPresenceColumnDef,
} from "@/components/ObservableDataGrid";
import { BookModel } from "../books-data-source";

export function contaminationColumn() {
  return aspectsPresenceColumnDef<BookModel>(
    (aspectId) => aspectId.startsWith("contamination."),
    { display: "none" },
    {
      headerName: "Contamination",
      width: 200,
      filter: aspectsFilter("contamination", "auto"),
    }
  );
}
