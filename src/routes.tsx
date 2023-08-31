import React from "react";
import { Route, Routes } from "react-router";

import IndexPage from "./pages/Index";
import BookCatalog from "./pages/BookCatalog";
import ProvisionsCatalog from "./pages/ProvisionsCatalog";
import MemoriesCompendiumPage from "./pages/MemoriesCompendiumPage";
import ToolsCatalogPage from "./pages/ToolsCatalogPage";
const AppRoutes = () => (
  <Routes>
    <Route index element={<IndexPage />} />
    <Route path="/book-catalog" element={<BookCatalog />} />
    <Route path="/provisions-catalog" element={<ProvisionsCatalog />} />
    <Route path="/memories" element={<MemoriesCompendiumPage />} />
    <Route path="/tools-catalog" element={<ToolsCatalogPage />} />
  </Routes>
);

export default AppRoutes;
