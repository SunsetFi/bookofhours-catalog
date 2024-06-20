import React from "react";
import { mapValues } from "lodash";

import { CellContext, RowData } from "@tanstack/react-table";

import AspectsList from "../../Aspects/AspectsList";

function AspectsListCell<T extends RowData>({
  showLevel,
  ...props
}: CellContext<T, Record<string, React.ReactNode>> & { showLevel: boolean }) {
  const value = props.getValue();
  const renderValue = React.useMemo(
    () => (showLevel ? value : mapValues(value, () => null)),
    [value, showLevel]
  );

  return <AspectsList aspects={renderValue} />;
}

export default AspectsListCell;
