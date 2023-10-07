import React from "react";
import { IdentifiedColumnDef } from "@tanstack/react-table";
import { Observable, map } from "rxjs";
import { mapValues, pick, pickBy } from "lodash";

import { mergeMapIfNotNull } from "@/observables";
import { aspectsMagnitude } from "@/aspects";

import { ElementStackModel } from "@/services/sh-game";
import { useUnlockedLocationLabels } from "@/services/sh-game/hooks";

import { MultiselectOptionsFilter } from "../filters/multiselect-filter";
import { AspectsFilter, aspectsFilter } from "../filters/aspects-filter";

import { AspectsListCell, TextWrapCell, ElementIconCell } from "../cells";

import { createObservableColumnHelper } from "./observable-column-helper";

export function createElementStackColumnHelper<
  T extends ElementStackModel = ElementStackModel
>() {
  const columnHelper = createObservableColumnHelper<T>();
  return Object.assign(columnHelper, {
    label: (def?: Partial<IdentifiedColumnDef<T, string | null>>) =>
      columnHelper.observe("label$" as any, {
        id: "name",
        size: 200,
        header: "Name",
        cell: TextWrapCell,
        filterFn: "includesString",
        ...def,
      }),
    elementIcon: () =>
      columnHelper.observe("elementId$" as any, {
        id: "icon",
        header: "",
        size: 100,
        enableSorting: false,
        cell: ElementIconCell,
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
            }),
            map((aspects) =>
              showLevel ? aspects : mapValues(aspects, () => null)
            )
          ),
        {
          id,
          header: "Aspects",
          size: 200,
          cell: AspectsListCell,
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
        cell: TextWrapCell,
      }),
    location: () =>
      columnHelper.observe(
        (item) =>
          item.parentTerrain$.pipe(
            mergeMapIfNotNull((terrain) => terrain.label$)
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
