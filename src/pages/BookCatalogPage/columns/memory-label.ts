import { textColumnDef } from "@/components/ObservableDataGrid";
import { BookModel } from "../books-data-source";

export function memoryLabelColumn() {
  return textColumnDef<BookModel>("Memory", "memory", "memoryLabel$", {
    width: 150,
  });
}
