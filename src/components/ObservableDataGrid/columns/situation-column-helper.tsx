import React from "react";
import { IdentifiedColumnDef } from "@tanstack/react-table";
import { Observable, map } from "rxjs";
import { pick, pickBy } from "lodash";

import { switchMapIfNotNull } from "@/observables";
import { aspectsMagnitude } from "@/aspects";

import { SituationModel } from "@/services/sh-game";
import { useUnlockedLocationLabels } from "@/services/sh-game/hooks";

import {
  MultiselectOptionsFilter,
  AspectsFilter,
  aspectsFilter,
  TextFilter,
} from "../filters";

import { AspectsListCell, TextWrapCell, VerbIconCell } from "../cells";

import { createObservableColumnHelper } from "./observable-column-helper";

export function createSituationColumnHelper<
  T extends SituationModel = SituationModel
>() {
  const columnHelper = createObservableColumnHelper<T>();
  return Object.assign(columnHelper, {
    label: (def?: Partial<IdentifiedColumnDef<T, string | null>>) =>
      columnHelper.observe("label$" as any, {
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
        cell: VerbIconCell,
      }),
    aspectsList: (
      id: string,
      aspects: readonly string[] | ((aspectId: string) => boolean),
      {
        showLevel = true,
        aspectsSource = (model) => model.aspects$,
        ...def
      }: Partial<IdentifiedColumnDef<T, Record<string, React.ReactNode>>> & {
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
      columnHelper.observe("description$" as any, {
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
          header: "Location",
          size: 170,
          cell: TextWrapCell,
          filterFn: "arrIncludesSome",
          meta: {
            filterComponent: (props) => {
              const locations = useUnlockedLocationLabels() ?? [];
              return (
                <MultiselectOptionsFilter
                  allowedValues={locations}
                  {...props}
                />
              );
            },
          },
        }
      ),
  });
}
