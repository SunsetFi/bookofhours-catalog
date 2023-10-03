import {
  aspectsColumnDef,
  aspectsFilter,
} from "@/components/ObservableDataGrid";

import { BookModel } from "../books-data-source";

export function mysteryColumn() {
  return aspectsColumnDef<BookModel>(
    (aspectId) => aspectId.startsWith("mystery."),
    {
      headerName: "Mystery",
      filter: aspectsFilter("mystery", "auto"),
      width: 150,
      aspectIconSize: 50,
    }
  );
}
