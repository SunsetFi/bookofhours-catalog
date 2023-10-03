import { powerAspects } from "@/aspects";

import { aspectsObservableColumnDef } from "@/components/ObservableDataGrid";

import { BookModel } from "../books-data-source";

export function memoryAspectsColumn() {
  return aspectsObservableColumnDef<BookModel>(
    "memoryAspects",
    (element) => element.memoryAspects$,
    powerAspects,
    {
      headerName: "Memory Aspects",
      width: 210,
    }
  );
}
