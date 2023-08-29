import React from "react";
import { Route, Routes } from "react-router";

import IndexPage from "./pages/Index";
import BookCatalog from "./pages/BookCatalog";
import ProvisionsCatalog from "./pages/ProvisionsCatalog";

const AppRoutes = () => (
  <Routes>
    <Route index element={<IndexPage />} />
    <Route path="/book-catalog" element={<BookCatalog />} />
    <Route path="/provisions-catalog" element={<ProvisionsCatalog />} />
  </Routes>
);

export default AppRoutes;
