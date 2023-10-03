import * as React from "react";

import { ObservableDataGridColumnDef } from "@/components/ObservableDataGrid";
import ElementIcon from "@/components/ElementIcon";

import { BookModel } from "../books-data-source";

export function memoryIconColumn(): ObservableDataGridColumnDef<BookModel> {
  return {
    headerName: "",
    observable: "memoryElementId$",
    width: 90,
    renderCell: ({ value }) => (
      <ElementIcon elementId={value} width={75} title="Memory" />
    ),
  };
}
