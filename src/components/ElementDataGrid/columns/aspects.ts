import { map } from "rxjs";
import { pick } from "lodash";

import { renderAspects } from "../cells/aspects-list";
import { aspectsFilter } from "../filters/aspects";

import { ElementDataGridColumnDef } from "../types";

export function aspectsColumnDef(
  pickAspects: readonly string[],
  additional: Partial<
    Omit<ElementDataGridColumnDef, "field" | "observable">
  > = {}
): ElementDataGridColumnDef {
  return {
    headerName: "Aspects",
    width: 300,
    wrap: true,
    renderCell: renderAspects,
    filter: aspectsFilter(pickAspects),
    ...additional,
    observable: (element) =>
      element.elementAspects$.pipe(
        map((aspects) => pick(aspects, pickAspects))
      ),
  };
}
