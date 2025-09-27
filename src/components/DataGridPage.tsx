import React from "react";

import {
  IdentifierItemDataGrid,
  IdentifierItemDataGridProps,
  IdentifierItem,
  useDataGridQuerySettings,
} from "./ObservableDataGrid";

import PageContainer from "./PageContainer";

export interface DataGridPageProps<T extends IdentifierItem>
  extends Omit<
    IdentifierItemDataGridProps<T>,
    "settings" | "filters" | "onSettingsChange" | "onFilterChange"
  > {
  title: string;
}

function DataGridPage<T extends IdentifierItem>({
  title,
  ...props
}: DataGridPageProps<T>) {
  const settings = useDataGridQuerySettings();

  return (
    <PageContainer title={title}>
      <IdentifierItemDataGrid {...props} {...settings} />
    </PageContainer>
  );
}

export default DataGridPage;
