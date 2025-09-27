import React from "react";

import { RecipeModel } from "@/services/sh-compendium";

import DataGridPage from "@/components/DataGridPage";
import { createObservableColumnHelper } from "@/components/ObservableDataGrid";

import { useCookables } from "./cooking-data-source";

const columnHelper = createObservableColumnHelper<RecipeModel>();

const columns = [
  columnHelper.observeText("label$", {
    id: "label",
    header: "Foodstuff",
  }),
];

const CookingCatalogPage = () => {
  const cookables$ = useCookables();
  return (
    <DataGridPage
      title="The Labors of the Kitchen"
      columns={columns}
      items$={cookables$}
      defaultSortColumn="label"
    />
  );
};

export default CookingCatalogPage;
