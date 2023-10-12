import { ObservableKeys } from "@/observables";
import {
  AccessorFn,
  ColumnDef,
  ColumnDefBase,
  GroupColumnDef,
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

// Begin enhanced column defs

export interface EnhancedColumnDefBase<TData extends RowData, TValue = unknown>
  extends ColumnDefBase<TData, TValue> {
  rowHeader?: boolean;
}

export type EnhancedDisplayColumnDef<
  TData extends RowData,
  TValue = unknown
> = EnhancedColumnDefBase<TData, TValue> & ColumnIdentifiers<TData, TValue>;

interface EnhancedAccessorKeyColumnDefBase<
  TData extends RowData,
  TValue = unknown
> extends EnhancedColumnDefBase<TData, TValue> {
  id?: string;
  accessorKey: (string & {}) | keyof TData;
}
export type EnhancedAccessorKeyColumnDef<
  TData extends RowData,
  TValue = unknown
> = EnhancedAccessorKeyColumnDefBase<TData, TValue> &
  Partial<ColumnIdentifiers<TData, TValue>>;

interface EnhancedAccessorFnColumnDefBase<
  TData extends RowData,
  TValue = unknown
> extends EnhancedColumnDefBase<TData, TValue> {
  accessorFn: AccessorFn<TData, TValue>;
}
export type EnhancedAccessorFnColumnDef<
  TData extends RowData,
  TValue = unknown
> = EnhancedAccessorFnColumnDefBase<TData, TValue> &
  ColumnIdentifiers<TData, TValue>;

export type EnhancedAccessorColumnDef<
  TData extends RowData,
  TValue = unknown
> =
  | EnhancedAccessorKeyColumnDef<TData, TValue>
  | EnhancedAccessorFnColumnDef<TData, TValue>;

// End enhanced column defs

// Begin observable column def

export type ObservableAccessorFn<TData extends RowData, TValue = unknown> = (
  originalRow: TData,
  index: number
) => Observable<TValue>;

interface ObservableAccessorFnColumnDefBase<
  TData extends RowData,
  TValue = unknown
> extends EnhancedColumnDefBase<TData, TValue> {
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
> extends EnhancedColumnDefBase<TData, TValue> {
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

// End observable column def

export type ObservableColumnDef<TData extends RowData, TValue = unknown> =
  | EnhancedDisplayColumnDef<TData, TValue>
  | GroupColumnDef<TData, TValue>
  | EnhancedAccessorColumnDef<TData, TValue>
  | ObservableAccessorColumnDef<TData, TValue>;

export function isRowHeaderColumn(col: ColumnDef<any, any>): boolean {
  return "rowHeader" in col && col.rowHeader === true;
}
