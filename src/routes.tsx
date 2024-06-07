import React from "react";
import { Route, Routes, Navigate } from "react-router";

import sitemap from "@/sitemap";

const AppRoutes = () => (
  <Routes>
    {sitemap.map(({ path, Component }) => (
      <Route key={path} path={path} Component={Component} />
    ))}
    <Route path="*" Component={() => <Navigate to="/" />} />
  </Routes>
);

export default AppRoutes;
