import * as React from "react";

import Box from "@mui/material/Box";

import { useObservation } from "@/observables";

import PinElementIconButton from "@/components/PinElementIconButton";

import { BookModel } from "../BookDataSource";
import { ObservableDataGridColumnDef } from "@/components/ObservableDataGrid";

export function memoryCommandsColumn(): ObservableDataGridColumnDef<BookModel> {
  return {
    headerName: "",
    width: 40,
    field: "$item",
    renderCell: ({ value }) => <MemoryButtons model={value} />,
  };
}

interface MemoryButtonsProps {
  model: BookModel;
}

const MemoryButtons = ({ model }: MemoryButtonsProps) => {
  const memoryElementId = useObservation(model.memoryElementId$);
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {memoryElementId && <PinElementIconButton elementId={memoryElementId} />}
    </Box>
  );
};
