import { PageSearchProviderPipe } from "./services/search";

import BookCatalogPage, {
  bookCatalogSearchProvider,
} from "./pages/BookCatalogPage";
import BrancrugCatalogPage from "./pages/BrancrugCatalogPage";
import CraftingCatalogPage, {
  craftingSearchProvider,
} from "./pages/CraftingCatalogPage";
import DeskPage from "./pages/DeskPage";
import FurnishingsCatalogPage, {
  furnishingsSearchProvider,
} from "./pages/FurnishingsCatalogPage";
import HarvestCatalogPage from "./pages/HarvestCatalogPage";
import LocationsCatalogPage from "./pages/LocationsCatalogPage";
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
import WisdomTreePage from "./pages/WisdomTreePage";
import WorkstationCatalogPage from "./pages/WorkstationCatalogPage";

export interface SiteMapNavItem {
  label: string;
  iconSource: "aspect" | "verb";
  iconName: string;
  path: string;
  searchProvider?: PageSearchProviderPipe;
  Component: React.ComponentType<{}>;
}
export function isSiteMapNavItem(item: SiteMapItem): item is SiteMapNavItem {
  return (item as SiteMapNavItem).label !== undefined;
}

export interface SiteMapDividerItem {
  divider: true;
}

export function isSiteMapDividerItem(
  item: SiteMapItem
): item is SiteMapDividerItem {
  return (item as SiteMapDividerItem).divider === true;
}

export type SiteMapItem = SiteMapNavItem | SiteMapDividerItem;

export function getSitemapItemIconPath(item: SiteMapNavItem): string {
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
    path: "/desk",
    Component: DeskPage,
  },
  {
    divider: true,
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
    divider: true,
  },
  {
    label: "Skills",
    iconSource: "aspect",
    iconName: "skill",
    path: "/skills",
    searchProvider: skillsSearchProvider,
    Component: SkillsCatalogPage,
  },
  // {
  //   label: "Wisdoms",
  //   iconSource: "aspect",
  //   iconName: "difficulty.keeper",
  //   path: "/wisdoms",
  //   Component: WisdomTreePage,
  // },
  {
    label: "Craftables",
    iconSource: "aspect",
    iconName: "difficulty.keeper",
    path: "/craftables",
    searchProvider: craftingSearchProvider,
    Component: CraftingCatalogPage,
  },
  {
    divider: true,
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
];

export default sitemap;
