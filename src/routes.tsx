import React from "react";
import { Route, Routes } from "react-router";

import IndexPage from "./pages/Index";
import BookCatalogPage from "./pages/BookCatalogPage";
import ProvisionsCatalog from "./pages/ProvisionsCatalog";
import MemoriesCompendiumPage from "./pages/MemoriesCompendiumPage";
import ToolsCatalogPage from "./pages/ToolsCatalogPage";
import MaterialsCatalogPage from "./pages/MaterialsCatalogPage";
import FurnishingsCatalogPage from "./pages/FurnishingsCatalogPage";
import CraftingCatalogPage from "./pages/CraftingCatalogPage";
import WorkstationCatalogPage from "./pages/WorkstationCatalogPage";

import ThingsCatalogPage from "./pages/ThingsCatalogPage";

const AppRoutes = () => {
  console.log("AppRoutes rendering");
  return (
    <Routes>
      <Route index Component={IndexPage} />
      <Route path="/books" Component={BookCatalogPage} />
      <Route path="/provisions" Component={ProvisionsCatalog} />
      <Route path="/memories" Component={MemoriesCompendiumPage} />
      <Route path="/tools" Component={ToolsCatalogPage} />
      <Route path="/materials" Component={MaterialsCatalogPage} />
      <Route path="/things" Component={ThingsCatalogPage} />
      <Route path="/furnishings" Component={FurnishingsCatalogPage} />
      <Route path="/craftables" Component={CraftingCatalogPage} />
      <Route path="/workstations" Component={WorkstationCatalogPage} />
    </Routes>
  );
};
export default AppRoutes;
