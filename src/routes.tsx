import React from "react";
import { Route, Routes } from "react-router";

import IndexPage from "./pages/Index";
import BookCatalogPage from "./pages/BookCatalogPage";
import ProvisionsCatalog from "./pages/ProvisionsCatalog";
import MemoriesCompendiumPage from "./pages/MemoriesCompendiumPage";
import ToolsCatalogPage from "./pages/ToolsCatalogPage";
import MaterialsCatalogPage from "./pages/MaterialsCatalogPage";
import FurnishingsCatalogPage from "./pages/FurnishingsCatalogPage";

const AppRoutes = () => (
  <Routes>
    <Route index element={<IndexPage />} />
    <Route path="/book-catalog" element={<BookCatalogPage />} />
    <Route path="/provisions-catalog" element={<ProvisionsCatalog />} />
    <Route path="/memories" element={<MemoriesCompendiumPage />} />
    <Route path="/tools-catalog" element={<ToolsCatalogPage />} />
    <Route path="/materials-catalog" element={<MaterialsCatalogPage />} />
    <Route path="/furnishings-catalog" element={<FurnishingsCatalogPage />} />
  </Routes>
);

export default AppRoutes;
