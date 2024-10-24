import React from "react";
import { Observable, distinctUntilChanged, map, tap } from "rxjs";
import { isEqual, pick, pickBy } from "lodash";

import { switchMapIfNotNull } from "@/observables";
import { aspectsMagnitude } from "@/aspects";

import { undecorateObjectInstance } from "@/object-decorator";

import { ElementStackModel } from "@/services/sh-game";
import { useUnlockedLocationLabels } from "@/services/sh-game/hooks";

import ElementStackIcon from "@/components/Elements/ElementStackIcon";

import {
  MultiselectFilter,
  AspectsFilter,
  aspectsFilter,
  multiSelectFilter,
} from "../filters";

import { AspectsListCell, TextWrapCell } from "../cells";

import { RowHeight, RowPaddingY } from "../constants";
import { EnhancedColumnDefBase } from "../types";

import { createObservableColumnHelper } from "./observable-column-helper";

export function createElementStackColumnHelper<
  T extends ElementStackModel = ElementStackModel
>() {
  const columnHelper = createObservableColumnHelper<T>();
  return Object.assign(columnHelper, {
    label: (def?: Partial<EnhancedColumnDefBase<T, string | null>>) =>
      columnHelper.observeText("label$" as any, {
        id: "label",
        size: 200,
        header: "Name",
        rowHeader: true,
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
            }),
            distinctUntilChanged(isEqual)
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
        id: "description",
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
