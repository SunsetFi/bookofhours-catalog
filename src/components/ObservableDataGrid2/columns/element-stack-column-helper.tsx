import React from "react";
import { IdentifiedColumnDef } from "@tanstack/react-table";
import { map } from "rxjs";
import { pick } from "lodash";
import { Aspects } from "secrethistories-api";

import { aspectsMagnitude } from "@/aspects";

import { ElementStackModel } from "@/services/sh-game";

import ElementIcon from "@/components/ElementIcon";
import AspectsList from "@/components/AspectsList";

import { createObservableColumnHelper } from "./observable-column-helper";
import { AspectsFilter, aspectsFilter } from "../filters/aspects-filter";

const columnHelper = createObservableColumnHelper<ElementStackModel>();
export const elementStackColumnHelper = Object.assign(columnHelper, {
  label: (
    def?: Partial<IdentifiedColumnDef<ElementStackModel, string | null>>
  ) =>
    columnHelper.observe("label$", {
      id: "label",
      size: 200,
      ...def,
    }),
  elementIcon: () =>
    columnHelper.observe("elementId$", {
      id: "icon",
      header: "",
      size: 100,
      enableSorting: false,
      cell: (context) => (
        <ElementIcon width={75} elementId={context.getValue()} />
      ),
    }),
  aspectsList: (
    id: string,
    aspects: readonly string[],
    def?: Partial<IdentifiedColumnDef<ElementStackModel, Aspects>>
  ) =>
    columnHelper.observe(
      (model) =>
        model.aspects$.pipe(
          map((modelAspects) => pick(modelAspects, aspects) as Aspects)
        ),
      {
        id,
        header: "Aspects",
        size: 200,
        cell: (context) => <AspectsList aspects={context.getValue()} />,
        sortingFn: (a, b, columnId) =>
          aspectsMagnitude(a.getValue(columnId)) -
          aspectsMagnitude(b.getValue(columnId)),
        filterFn: aspectsFilter,
        meta: {
          filterComponent: (props) => (
            <AspectsFilter allowedAspectIds={aspects} {...props} />
          ),
        },
        ...def,
      }
    ),
  description: () =>
    columnHelper.observe("description$", {
      size: Number.MAX_SAFE_INTEGER,
      header: "Description",
    }),
});
