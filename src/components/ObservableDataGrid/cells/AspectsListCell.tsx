import * as React from "react";

import { CellContext, RowData } from "@tanstack/react-table";

import AspectsList from "@/components/AspectsList";
import { mapValues } from "lodash";

function AspectsListCell<T extends RowData>({
  showLevel,
  ...props
}: CellContext<T, Record<string, React.ReactNode>> & { showLevel: boolean }) {
  let value = props.getValue();
  if (!showLevel) {
    value = mapValues(value, () => null);
  }

  return <AspectsList aspects={value} />;
}

export default AspectsListCell;
