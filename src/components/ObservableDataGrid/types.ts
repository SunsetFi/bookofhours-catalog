import * as React from "react";

import { Observable } from "rxjs";

import type { GridColDef } from "@mui/x-data-grid";

import { ObservableKeys } from "@/observables";

export interface ObservableDataGridColumnDef<TItem>
  extends Pick<
    GridColDef,
    | "headerName"
    | "minWidth"
    | "maxWidth"
    | "width"
    | "flex"
    | "renderHeader"
    | "renderCell"
  > {
  field?: keyof TItem;
  wrap?: boolean;
  observable?: ObservableKeys<TItem> | ((element: TItem) => Observable<any>);
  filter?: FilterDef;
}

export interface FilterComponentProps<T = any> {
  value: T;
  onChange(value: T): void;
}

export interface FilterDef<TValue = any, TFilter = any> {
  FilterComponent: React.ComponentType<FilterComponentProps<TFilter>>;
  filterValue(value: TValue, filter: TFilter): boolean;
  defaultFilterValue?: TFilter;
}
