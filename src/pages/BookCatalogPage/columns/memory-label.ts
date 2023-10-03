import { textColumnDef } from "@/components/ObservableDataGrid";
import { BookModel } from "../BookDataSource";

export function memoryLabelColumn() {
  return textColumnDef<BookModel>("Memory", "memory", "memoryLabel$", {
    width: 150,
  });
}
