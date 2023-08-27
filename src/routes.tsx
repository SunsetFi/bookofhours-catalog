import React from "react";
import { Route, Routes } from "react-router";

import IndexPage from "./pages/Index";
import BookCatalog from "./pages/BookCatalog";

const AppRoutes = () => (
  <Routes>
    <Route index element={<IndexPage />} />
    <Route path="/book-catalog" element={<BookCatalog />} />
  </Routes>
);

export default AppRoutes;
