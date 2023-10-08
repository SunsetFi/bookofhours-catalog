import { PageSearchProviderPipe } from "./services/search";

import BookCatalogPage, {
  bookCatalogSearchProvider,
} from "./pages/BookCatalogPage";
import CraftingCatalogPage, {
  craftingSearchProvider,
} from "./pages/CraftingCatalogPage";
import FurnishingsCatalogPage, {
  furnishingsSearchProvider,
} from "./pages/FurnishingsCatalogPage";
import HarvestCatalogPage from "./pages/HarvestCatalogPage";
import MaterialsCatalogPage, {
  materialsSearchProvider,
} from "./pages/MaterialsCatalogPage";
import ProvisionsCatalog, {
  provisionsSearchProvider,
} from "./pages/ProvisionsCatalog";
import SkillsCatalogPage, {
  skillsSearchProvider,
} from "./pages/SkillsCatalogPage";
import ThingsCatalogPage, {
  thingsSearchProvider,
} from "./pages/ThingsCatalogPage";
import ToolsCatalogPage, {
  toolsSearchProvider,
} from "./pages/ToolsCatalogPage";
import WorkstationCatalogPage from "./pages/WorkstationCatalogPage";
import LocationsCatalogPage from "./pages/LocationsCatalogPage";

interface SiteMapItem {
  label: string;
  aspectIcon: string;
  path: string;
  searchProvider?: PageSearchProviderPipe;
  Component: React.ComponentType<{}>;
}

const sitemap: SiteMapItem[] = [
  {
    label: "Books",
    aspectIcon: "readable",
    path: "/books",
    searchProvider: bookCatalogSearchProvider,
    Component: BookCatalogPage,
  },
  {
    label: "Locations",
    aspectIcon: "knock",
    path: "/locations",
    Component: LocationsCatalogPage,
  },
  {
    label: "Provisions",
    aspectIcon: "beverage",
    path: "/provisions",
    searchProvider: provisionsSearchProvider,
    Component: ProvisionsCatalog,
  },
  {
    label: "Tools",
    aspectIcon: "tool",
    path: "/tools",
    searchProvider: toolsSearchProvider,
    Component: ToolsCatalogPage,
  },
  {
    label: "Materials",
    aspectIcon: "material",
    path: "/materials",
    searchProvider: materialsSearchProvider,
    Component: MaterialsCatalogPage,
  },
  {
    label: "Things",
    aspectIcon: "thing",
    path: "/things",
    searchProvider: thingsSearchProvider,
    Component: ThingsCatalogPage,
  },
  {
    label: "Furnishings",
    aspectIcon: "comfort",
    path: "/furnishings",
    searchProvider: furnishingsSearchProvider,
    Component: FurnishingsCatalogPage,
  },
  {
    label: "Skills",
    aspectIcon: "skill",
    path: "/skills",
    searchProvider: skillsSearchProvider,
    Component: SkillsCatalogPage,
  },
  {
    label: "Craftables",
    aspectIcon: "difficulty.keeper",
    path: "/craftables",
    searchProvider: craftingSearchProvider,
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
];

export default sitemap;
