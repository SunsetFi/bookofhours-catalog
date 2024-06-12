import React from "react";

import { CellContext, RowData } from "@tanstack/react-table";

import ElementIcon from "../../Elements/ElementIcon";

import { RowHeight, RowPaddingY } from "../constants";

function ElementIconCell<T extends RowData>(
  props: CellContext<T, string | null>
) {
  return (
    <ElementIcon
      maxWidth={75}
      maxHeight={RowHeight - RowPaddingY * 2}
      elementId={props.getValue() as string}
    />
  );
}

export default ElementIconCell;
