import React from "react";
import { IdentifiedColumnDef } from "@tanstack/react-table";
import { Observable, map } from "rxjs";
import { mapValues, pick, pickBy } from "lodash";

import { mergeMapIfNotNull } from "@/observables";
import { aspectsMagnitude } from "@/aspects";

import { ElementStackModel } from "@/services/sh-game";
import { useUnlockedLocationLabels } from "@/services/sh-game/hooks";

import ElementIcon from "@/components/ElementIcon";
import AspectsList from "@/components/AspectsList";

import { AspectsFilter, aspectsFilter } from "../filters/aspects-filter";
import { MultiselectOptionsFilter } from "../filters/multiselect-filter";

import { RowHeight, RowPaddingY } from "../constants";
import TextWrapCell from "../cells/TextWrapCell";

import { createObservableColumnHelper } from "./observable-column-helper";

const columnHelper = createObservableColumnHelper<ElementStackModel>();
export const elementStackColumnHelper = Object.assign(columnHelper, {
  label: (
    def?: Partial<IdentifiedColumnDef<ElementStackModel, string | null>>
  ) =>
    columnHelper.observe("label$", {
      id: "label",
      size: 200,
      header: "Name",
      cell: TextWrapCell,
      filterFn: "includesString",
      ...def,
    }),
  elementIcon: () =>
    columnHelper.observe("elementId$", {
      id: "icon",
      header: "",
      size: 100,
      enableSorting: false,
      cell: (context) => (
        <ElementIcon
          maxWidth={75}
          maxHeight={RowHeight - RowPaddingY * 2}
          elementId={context.getValue()}
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
    }: Partial<
      IdentifiedColumnDef<ElementStackModel, Record<string, React.ReactNode>>
    > & {
      showLevel?: boolean;
      aspectsSource?: (
        model: ElementStackModel
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
        cell: (context) => (
          <AspectsList
            aspects={
              showLevel
                ? context.getValue()
                : mapValues(context.getValue(), () => null)
            }
          />
        ),
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
    columnHelper.observe("description$", {
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
              <MultiselectOptionsFilter allowedValues={locations} {...props} />
            );
          },
        },
      }
    ),
});
