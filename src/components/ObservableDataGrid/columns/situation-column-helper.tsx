import React from "react";
import { Observable, map } from "rxjs";
import { pick, pickBy } from "lodash";

import { switchMapIfNotNull } from "@/observables";
import { aspectsMagnitude } from "@/aspects";

import { SituationModel } from "@/services/sh-game";
import { useUnlockedLocationLabels } from "@/services/sh-game/hooks";

import {
  MultiselectFilter,
  AspectsFilter,
  aspectsFilter,
  TextFilter,
  multiSelectFilter,
} from "../filters";
import { EnhancedColumnDefBase } from "../types";

import { AspectsListCell, TextWrapCell, VerbIconCell } from "../cells";

import { createObservableColumnHelper } from "./observable-column-helper";

export function createSituationColumnHelper<
  T extends SituationModel = SituationModel
>() {
  const columnHelper = createObservableColumnHelper<T>();
  return Object.assign(columnHelper, {
    label: (def?: Partial<EnhancedColumnDefBase<T, string | null>>) =>
      columnHelper.observe("verbLabel$" as any, {
        id: "label",
        size: 200,
        header: "Name",
        cell: TextWrapCell,
        filterFn: "includesString",
        rowHeader: true,
        meta: {
          filterComponent: TextFilter,
        },
        ...def,
      }),
    verbIcon: () =>
      columnHelper.observe("verbId$" as any, {
        id: "icon",
        header: "",
        size: 100,
        enableSorting: false,
        enableColumnFilter: false,
        cell: VerbIconCell,
      }),
    aspectsList: (
      id: string,
      aspects: readonly string[] | ((aspectId: string) => boolean),
      {
        showLevel = true,
        aspectsSource = (model) => model.aspects$,
        ...def
      }: Partial<EnhancedColumnDefBase<T, Record<string, React.ReactNode>>> & {
        showLevel?: boolean;
        aspectsSource?: (
          model: T
        ) => Observable<Record<string, React.ReactNode>>;
      } = {}
    ) =>
      columnHelper.observe(
        (model) =>
          aspectsSource(model).pipe(
            map((modelAspects) => {
              if (typeof aspects === "function") {
                return pickBy(modelAspects, (_v, k) => aspects(k));
              } else {
                return pick(modelAspects, aspects);
              }
            })
          ),
        {
          id,
          header: "Aspects",
          size: 200,
          cell: (props) => <AspectsListCell {...props} showLevel={showLevel} />,
          sortingFn: (a, b, columnId) =>
            aspectsMagnitude(a.getValue(columnId)) -
            aspectsMagnitude(b.getValue(columnId)),
          filterFn: aspectsFilter,
          meta: {
            filterComponent: (props) => (
              <AspectsFilter
                allowedAspectIds={
                  typeof aspects === "function" ? "auto" : aspects
                }
                {...props}
              />
            ),
          },
          ...def,
        }
      ),
    description: () =>
      columnHelper.observe("verbDescription$" as any, {
        id: "description",
        size: Number.MAX_SAFE_INTEGER,
        header: "Description",
        enableSorting: false,
        filterFn: "includesString",
        meta: {
          filterComponent: TextFilter,
        },
        cell: TextWrapCell,
      }),
    location: () =>
      columnHelper.observe(
        (item) =>
          item.parentTerrain$.pipe(
            switchMapIfNotNull((terrain) => terrain.label$)
          ),
        {
          id: "location",
          header: "Location",
          size: 170,
          cell: TextWrapCell,
          filterFn: multiSelectFilter,
          meta: {
            filterComponent: (props) => {
              const locations = useUnlockedLocationLabels() ?? [];
              return <MultiselectFilter allowedValues={locations} {...props} />;
            },
          },
        }
      ),
  });
}
