import { ObservableKeys } from "@/observables";
import {
  ColumnDef,
  ColumnDefBase,
  RowData,
  StringOrTemplateHeader,
} from "@tanstack/react-table";

import { Observable } from "rxjs";

// These arent exported for some weird reason
interface StringHeaderIdentifier {
  header: string;
  id?: string;
}
interface IdIdentifier<TData extends RowData, TValue> {
  id: string;
  header?: StringOrTemplateHeader<TData, TValue>;
}
type ColumnIdentifiers<TData extends RowData, TValue> =
  | IdIdentifier<TData, TValue>
  | StringHeaderIdentifier;

export type ObservableAccessorFn<TData extends RowData, TValue = unknown> = (
  originalRow: TData,
  index: number
) => Observable<TValue>;

interface ObservableAccessorFnColumnDefBase<
  TData extends RowData,
  TValue = unknown
> extends ColumnDefBase<TData, TValue> {
  observationFn: ObservableAccessorFn<TData, TValue>;
}
export type ObservableAccessorFnColumnDef<
  TData extends RowData,
  TValue = unknown
> = ObservableAccessorFnColumnDefBase<TData, TValue> &
  ColumnIdentifiers<TData, TValue>;
export function isObservableAccessorFnColumnDef<TData, TValue>(
  column: ObservableColumnDef<TData, TValue>
): column is ObservableAccessorFnColumnDef<TData, TValue> {
  return "observationFn" in column;
}

interface ObservableAccessorKeyColumnDefBase<
  TData extends RowData,
  TValue = unknown
> extends ColumnDefBase<TData, TValue> {
  id?: string;
  observationKey: ObservableKeys<TData>;
}
export type ObservableAccessorKeyColumnDef<
  TData extends RowData,
  TValue = unknown
> = ObservableAccessorKeyColumnDefBase<TData, TValue> &
  Partial<ColumnIdentifiers<TData, TValue>>;
export function isObservableAccessorKeyColumnDef<TData, TValue>(
  column: ObservableColumnDef<TData, TValue>
): column is ObservableAccessorKeyColumnDef<TData, TValue> {
  return "observationKey" in column;
}

export type ObservableAccessorColumnDef<
  TData extends RowData,
  TValue = unknown
> =
  | ObservableAccessorKeyColumnDef<TData, TValue>
  | ObservableAccessorFnColumnDef<TData, TValue>;

export type ObservableColumnDef<TData extends RowData, TValue = unknown> =
  | ColumnDef<TData, TValue>
  | ObservableAccessorColumnDef<TData, TValue>;
