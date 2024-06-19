import React from "react";
import { IdentifiedColumnDef } from "@tanstack/react-table";
import { Observable, map } from "rxjs";
import { pick, pickBy } from "lodash";

import { switchMapIfNotNull } from "@/observables";
import { aspectsMagnitude } from "@/aspects";

import { undecorateObjectInstance } from "@/object-decorator";

import { ElementStackModel } from "@/services/sh-game";
import { useUnlockedLocationLabels } from "@/services/sh-game/hooks";

import ElementStackIcon from "@/components/Elements/ElementStackIcon";

import {
  MultiselectOptionsFilter,
  AspectsFilter,
  aspectsFilter,
} from "../filters";

import { AspectsListCell, TextWrapCell } from "../cells";

import { RowHeight, RowPaddingY } from "../constants";

import { createObservableColumnHelper } from "./observable-column-helper";

export function createElementStackColumnHelper<
  T extends ElementStackModel = ElementStackModel
>() {
  const columnHelper = createObservableColumnHelper<T>();
  return Object.assign(columnHelper, {
    label: (def?: Partial<IdentifiedColumnDef<T, string | null>>) =>
      columnHelper.observeText("label$" as any, {
        id: "label",
        size: 200,
        header: "Name",
        ...def,
      }),
    elementStackIcon: () =>
      columnHelper.display({
        id: "icon",
        header: "",
        size: 100,
        enableSorting: false,
        enableColumnFilter: false,
        cell: (context) => (
          <ElementStackIcon
            maxWidth={75}
            maxHeight={RowHeight - RowPaddingY * 2}
            // This is a hack as most tables decorate the instance, causing the drag and drop code
            // to get confused, as it does object references.
            elementStack={undecorateObjectInstance(context.row.original)}
          />
        ),
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
      columnHelper.observeText("description$" as any, {
        size: Number.MAX_SAFE_INTEGER,
        header: "Description",
        enableSorting: false,
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
