import React from "react";
import { sortBy } from "lodash";

import { useLocation } from "react-router";

import sitemap, { getSitemapItemIconPath, isSiteMapNavItem } from "@/sitemap";

const Favicon = () => {
  const { pathname } = useLocation();
  const icon = React.useMemo(
    () => document.querySelector<HTMLLinkElement>("link[rel~='icon']"),
    []
  );

  React.useEffect(() => {
    // Little hack since we have a "/" path now.
    const siteItem = sortBy(
      sitemap.filter(isSiteMapNavItem),
      (x) => x.path.length
    )
      .reverse()
      .find((x) => pathname.startsWith(x.path));
    if (siteItem) {
      document.title = `${siteItem.label} - The Hush House Catalog`;
      if (icon) {
        icon.href = `http://localhost:8081/${getSitemapItemIconPath(siteItem)}`;
      }
    } else {
      document.title = `The Hush House Catalog`;
      if (icon) {
        icon.href = `http://localhost:8081/api/compendium/elements/readable/icon.png`;
      }
    }
  }, [pathname, icon]);

  return null;
};

export default Favicon;
