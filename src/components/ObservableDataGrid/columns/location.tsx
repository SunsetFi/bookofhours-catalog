import React from "react";

import { mergeMapIfNotNull } from "@/observables";

import { ModelWithParentTerrain } from "@/services/sh-game";

import { ObservableDataGridColumnDef } from "../types";
import { MultiselectOptionsFilter } from "../filters";
import { useUnlockedLocationLabels } from "@/services/sh-game/hooks";

export function locationColumnDef<T extends ModelWithParentTerrain>(
  additional: Partial<
    Omit<ObservableDataGridColumnDef<T>, "field" | "observable">
  > = {}
): ObservableDataGridColumnDef<T> {
  return {
    headerName: "Location",
    width: 170,
    wrap: true,
    filter: {
      key: "location",
      FilterComponent: (props) => {
        const locations = useUnlockedLocationLabels() ?? [];
        return (
          <MultiselectOptionsFilter allowedValues={locations} {...props} />
        );
      },
      filterValue(value, filter) {
        if (filter.length === 0) {
          return true;
        }

        return filter.includes(value);
      },
      defaultFilterValue: [],
    },
    ...additional,
    observable: (item) =>
      item.parentTerrain$.pipe(mergeMapIfNotNull((terrain) => terrain.label$)),
  };
}
