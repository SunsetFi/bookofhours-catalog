import * as React from "react";
import { Aspects } from "secrethistories-api";

import type { GridRenderCellParams } from "@mui/x-data-grid/models";

import { AspectsList } from "@/components/AspectsList";

export interface AspectListCellProps
  extends GridRenderCellParams<any, Aspects> {
  iconSize?: number;
}

export function AspectsCell({ iconSize, value = {} }: AspectListCellProps) {
  return <AspectsList iconSize={iconSize} aspects={value} />;
}
