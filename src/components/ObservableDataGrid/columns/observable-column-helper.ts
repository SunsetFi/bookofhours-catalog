import {
  ColumnHelper as BaseColumnHelper,
  RowData,
  createColumnHelper as createBase,
} from "@tanstack/react-table";

import { ObservableKeys, Observation } from "@/observables";

import {
  EnhancedDisplayColumnDef,
  ObservableAccessorFn,
  ObservableColumnDef,
} from "../types";
import { TextWrapCell } from "../cells";
import { TextFilter } from "../filters";

export interface ObservableColumnHelper<TData extends RowData>
  extends BaseColumnHelper<TData> {
  observe<TProp extends ObservableKeys<TData>>(
    accessor: TProp,
    column: EnhancedDisplayColumnDef<TData, Observation<TData[TProp]>>
  ): ObservableColumnDef<TData, Observation<TData[TProp]>>;
  observe<TValue>(
    accessor: ObservableAccessorFn<TData, TValue>,
    column: EnhancedDisplayColumnDef<TData, TValue>
  ): ObservableColumnDef<TData, TValue>;

  observeText<TProp extends ObservableKeys<TData>>(
    accessor: TProp,
    column: EnhancedDisplayColumnDef<TData, Observation<TData[TProp]>>
  ): ObservableColumnDef<TData, Observation<TData[TProp]>>;
  observeText<TValue>(
    accessor: ObservableAccessorFn<TData, TValue>,
    column: EnhancedDisplayColumnDef<TData, TValue>
  ): ObservableColumnDef<TData, TValue>;
}
export function createObservableColumnHelper<
  TData extends RowData
>(): ObservableColumnHelper<TData> {
  const base = createBase<TData>();
  return {
    ...base,
    observe: (accessor: any, column: any) => {
      if (typeof accessor === "function") {
        return {
          ...column,
          observationFn: accessor,
        };
      } else {
        return {
          ...column,
          observationKey: accessor,
        };
      }
    },
    observeText: (accessor: any, column: any) => {
      column = {
        cell: TextWrapCell,
        filterFn: "includesString",
        rowHeader: true,
        ...column,
        meta: {
          filterComponent: TextFilter,
          ...(column.meta ?? {}),
        },
      };

      if (typeof accessor === "function") {
        return {
          ...column,
          observationFn: accessor,
        };
      } else {
        return {
          ...column,
          observationKey: accessor,
        };
      }
    },
  } as any; // typings are going ballistic here.
}
