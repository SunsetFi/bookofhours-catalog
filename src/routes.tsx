import React from "react";
import { Route, Routes } from "react-router";

import IndexPage from "@/pages/Index";

import sitemap from "@/sitemap";

const AppRoutes = () => (
  <Routes>
    <Route index Component={IndexPage} />
    {sitemap.map(({ path, Component }) => (
      <Route key={path} path={path} Component={Component} />
    ))}
  </Routes>
);

export default AppRoutes;
