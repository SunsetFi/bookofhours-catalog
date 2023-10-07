import * as React from "react";

import { CellContext, RowData } from "@tanstack/react-table";

import AspectsList from "@/components/AspectsList";

function AspectsListCell<T extends RowData>(
  props: CellContext<T, Record<string, React.ReactNode>>
) {
  return <AspectsList aspects={props.getValue()} />;
}

export default AspectsListCell;
