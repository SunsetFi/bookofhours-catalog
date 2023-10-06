import { RowData } from "@tanstack/react-table";

export interface FilterComponentProps<
  TFilterValue = any,
  TItemValue = TFilterValue
> {
  columnValues: TItemValue[];
  filterValue: TFilterValue;
  onChange(value: TFilterValue | null): void;
}

declare module "@tanstack/table-core" {
  interface ColumnMeta<TData extends RowData, TValue> {
    filterComponent?: React.ComponentType<FilterComponentProps>;
  }
}
