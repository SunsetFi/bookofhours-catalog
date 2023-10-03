import { SearchProviderPipe, pageProviderFromPath } from "./services/search";

import BookCatalogPage, {
  bookCatalogSearchProvider,
} from "./pages/BookCatalogPage";
import CraftingCatalogPage from "./pages/CraftingCatalogPage";
import FurnishingsCatalogPage from "./pages/FurnishingsCatalogPage";
import HarvestCatalogPage from "./pages/HarvestCatalogPage";
import MaterialsCatalogPage from "./pages/MaterialsCatalogPage";
import MemoriesCompendiumPage from "./pages/MemoriesCompendiumPage";
import ProvisionsCatalog, {
  provisionsSearchProvider,
} from "./pages/ProvisionsCatalog";
import SkillsCatalogPage from "./pages/SkillsCatalogPage";
import ThingsCatalogPage from "./pages/ThingsCatalogPage";
import ToolsCatalogPage from "./pages/ToolsCatalogPage";
import WorkstationCatalogPage from "./pages/WorkstationCatalogPage";

interface SiteMapItem {
  label: string;
  aspectIcon: string;
  path: string;
  searchProvider?: SearchProviderPipe;
  Component: React.ComponentType<{}>;
}

const sitemap: SiteMapItem[] = [
  {
    label: "Books",
    aspectIcon: "readable",
    path: "/books",
    searchProvider: pageProviderFromPath(bookCatalogSearchProvider, "/books"),
    Component: BookCatalogPage,
  },
  {
    label: "Provisions",
    aspectIcon: "beverage",
    path: "/provisions",
    searchProvider: pageProviderFromPath(
      provisionsSearchProvider,
      "/provisions"
    ),
    Component: ProvisionsCatalog,
  },
  {
    label: "Tools",
    aspectIcon: "tool",
    path: "/tools",
    Component: ToolsCatalogPage,
  },
  {
    label: "Materials",
    aspectIcon: "material",
    path: "/materials",
    Component: MaterialsCatalogPage,
  },
  {
    label: "Things",
    aspectIcon: "thing",
    path: "/things",
    Component: ThingsCatalogPage,
  },
  {
    label: "Furnishings",
    aspectIcon: "comfort",
    path: "/furnishings",
    Component: FurnishingsCatalogPage,
  },
  {
    label: "Skills",
    aspectIcon: "skill",
    path: "/skills",
    Component: SkillsCatalogPage,
  },
  {
    label: "Craftables",
    aspectIcon: "difficulty.keeper",
    path: "/craftables",
    Component: CraftingCatalogPage,
  },
  {
    label: "Workstations",
    aspectIcon: "forge",
    path: "/workstations",
    Component: WorkstationCatalogPage,
  },
  {
    label: "Harvest",
    aspectIcon: "nectar",
    path: "/harvest",
    Component: HarvestCatalogPage,
  },
  {
    label: "Memories",
    aspectIcon: "memory",
    path: "/memories",
    Component: MemoriesCompendiumPage,
  },
];

export default sitemap;
