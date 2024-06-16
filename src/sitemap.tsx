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
import IndexPage from "./pages/IndexPage";
import BrancrugCatalogPage from "./pages/BrancrugCatalogPage";

export interface SiteMapItem {
  label: string;
  iconSource: "aspect" | "verb";
  iconName: string;
  path: string;
  searchProvider?: PageSearchProviderPipe;
  Component: React.ComponentType<{}>;
}

export function getSitemapItemIconPath(item: SiteMapItem): string {
  if (item.iconSource === "aspect") {
    return `api/compendium/elements/${item.iconName}/icon.png`;
  } else if (item.iconSource === "verb") {
    return `api/compendium/verbs/${item.iconName}/icon.png`;
  }

  return `api/compendium/elements/readable/icon.png`;
}

const sitemap: SiteMapItem[] = [
  {
    label: "Desk",
    iconSource: "verb",
    iconName: "library.desk.nonna.consider",
    path: "/",
    Component: IndexPage,
  },
  {
    label: "Books",
    iconSource: "aspect",
    iconName: "readable",
    path: "/books",
    searchProvider: bookCatalogSearchProvider,
    Component: BookCatalogPage,
  },
  {
    label: "Locations",
    iconSource: "aspect",
    iconName: "knock",
    path: "/locations",
    Component: LocationsCatalogPage,
  },
  {
    label: "Brancrug",
    iconSource: "verb",
    iconName: "village.sweetbones.open",
    path: "/brancrug",
    Component: BrancrugCatalogPage,
  },
  {
    label: "Workstations",
    iconSource: "aspect",
    iconName: "forge",
    path: "/workstations",
    Component: WorkstationCatalogPage,
  },
  {
    label: "Harvest",
    iconSource: "aspect",
    iconName: "nectar",
    path: "/harvest",
    Component: HarvestCatalogPage,
  },
  {
    label: "Provisions",
    iconSource: "aspect",
    iconName: "beverage",
    path: "/provisions",
    searchProvider: provisionsSearchProvider,
    Component: ProvisionsCatalog,
  },
  {
    label: "Tools",
    iconSource: "aspect",
    iconName: "tool",
    path: "/tools",
    searchProvider: toolsSearchProvider,
    Component: ToolsCatalogPage,
  },
  {
    label: "Materials",
    iconSource: "aspect",
    iconName: "material",
    path: "/materials",
    searchProvider: materialsSearchProvider,
    Component: MaterialsCatalogPage,
  },
  {
    label: "Things",
    iconSource: "aspect",
    iconName: "thing",
    path: "/things",
    searchProvider: thingsSearchProvider,
    Component: ThingsCatalogPage,
  },
  {
    label: "Furnishings",
    iconSource: "aspect",
    iconName: "comfort",
    path: "/furnishings",
    searchProvider: furnishingsSearchProvider,
    Component: FurnishingsCatalogPage,
  },
  {
    label: "Skills",
    iconSource: "aspect",
    iconName: "skill",
    path: "/skills",
    searchProvider: skillsSearchProvider,
    Component: SkillsCatalogPage,
  },
  {
    label: "Craftables",
    iconSource: "aspect",
    iconName: "difficulty.keeper",
    path: "/craftables",
    searchProvider: craftingSearchProvider,
    Component: CraftingCatalogPage,
  },
];

export default sitemap;
