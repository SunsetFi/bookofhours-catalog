import React from "react";
import { Route, Routes } from "react-router";

import BookCatalogPage from "./pages/BookCatalogPage";
import CraftingCatalogPage from "./pages/CraftingCatalogPage";
import FurnishingsCatalogPage from "./pages/FurnishingsCatalogPage";
import HarvestCatalogPage from "./pages/HarvestCatalogPage";
import IndexPage from "./pages/Index";
import MaterialsCatalogPage from "./pages/MaterialsCatalogPage";
import MemoriesCompendiumPage from "./pages/MemoriesCompendiumPage";
import ProvisionsCatalog from "./pages/ProvisionsCatalog";
import SkillsCatalogPage from "./pages/SkillsCatalogPage";
import ThingsCatalogPage from "./pages/ThingsCatalogPage";
import ToolsCatalogPage from "./pages/ToolsCatalogPage";
import WorkstationCatalogPage from "./pages/WorkstationCatalogPage";

const AppRoutes = () => (
  <Routes>
    <Route index Component={IndexPage} />
    <Route path="/books" Component={BookCatalogPage} />
    <Route path="/provisions" Component={ProvisionsCatalog} />
    <Route path="/memories" Component={MemoriesCompendiumPage} />
    <Route path="/tools" Component={ToolsCatalogPage} />
    <Route path="/materials" Component={MaterialsCatalogPage} />
    <Route path="/harvest" Component={HarvestCatalogPage} />
    <Route path="/things" Component={ThingsCatalogPage} />
    <Route path="/furnishings" Component={FurnishingsCatalogPage} />
    <Route path="/craftables" Component={CraftingCatalogPage} />
    <Route path="/workstations" Component={WorkstationCatalogPage} />
    <Route path="/skills" Component={SkillsCatalogPage} />
  </Routes>
);
export default AppRoutes;
