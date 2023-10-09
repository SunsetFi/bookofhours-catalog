import * as React from "react";

import { CellContext, RowData } from "@tanstack/react-table";

import VerbIcon from "@/components/VerbIcon";

import { RowHeight, RowPaddingY } from "../constants";

function ElementIconCell<T extends RowData>(
  props: CellContext<T, string | null>
) {
  return (
    <VerbIcon
      maxWidth={75}
      maxHeight={RowHeight - RowPaddingY * 2}
      verbId={props.getValue() as string}
    />
  );
}

export default ElementIconCell;
