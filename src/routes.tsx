import React from "react";
import { Route, Routes } from "react-router";

import IndexPage from "./pages/Index";
import BookCatalogPage from "./pages/BookCatalogPage";
import ProvisionsCatalog from "./pages/ProvisionsCatalog";
import MemoriesCompendiumPage from "./pages/MemoriesCompendiumPage";
import ToolsCatalogPage from "./pages/ToolsCatalogPage";
import MaterialsCatalogPage from "./pages/MaterialsCatalogPage";
import FurnishingsCatalogPage from "./pages/FurnishingsCatalogPage";
import WorkstationCatalogPage from "./pages/WorkstationCatalogPage";
import PageContainer from "./components/PageContainer";
import ThingsCatalogPage from "./pages/ThingsCatalogPage";

const AppRoutes = () => (
  <Routes>
    <Route index Component={IndexPage} />
    <Route path="/books-catalog" Component={BookCatalogPage} />
    <Route path="/provisions-catalog" Component={ProvisionsCatalog} />
    <Route path="/memories" Component={MemoriesCompendiumPage} />
    <Route path="/tools-catalog" Component={ToolsCatalogPage} />
    <Route path="/materials-catalog" Component={MaterialsCatalogPage} />
    <Route path="/things-catalog" Component={ThingsCatalogPage} />
    <Route path="/furnishings-catalog" Component={FurnishingsCatalogPage} />
    <Route path="/workstations-catalog" Component={WorkstationCatalogPage} />
    <Route
      path="/blank"
      element={<div>This is blank, there should be few subscribers here.</div>}
    />
    <Route
      path="/test"
      element={<PageContainer title="test">test</PageContainer>}
    />
  </Routes>
);

export default AppRoutes;
