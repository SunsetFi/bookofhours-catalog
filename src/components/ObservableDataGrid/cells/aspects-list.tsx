import * as React from "react";
import { Aspects } from "secrethistories-api";

import type { GridRenderCellParams } from "@mui/x-data-grid/models";

import { AspectsList } from "@/components/AspectsList";

export function AspectsCell({
  value = {},
}: GridRenderCellParams<any, Aspects>) {
  return <AspectsList aspects={value} />;
}
