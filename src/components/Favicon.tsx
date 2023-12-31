import * as React from "react";

import { useLocation } from "react-router";

import sitemap from "@/sitemap";

const Favicon = () => {
  const { pathname } = useLocation();
  const icon = React.useMemo(
    () => document.querySelector<HTMLLinkElement>("link[rel~='icon']"),
    []
  );

  React.useEffect(() => {
    if (!icon) {
      return;
    }

    const siteItem = sitemap.find((x) => pathname.startsWith(x.path));
    if (siteItem) {
      document.title = `${siteItem.label} - The Hush House Catalog`;
      icon.href = `http://localhost:8081/api/compendium/elements/${siteItem.aspectIcon}/icon.png`;
    } else {
      document.title = `The Hush House Catalog`;
      icon.href = `http://localhost:8081/api/compendium/elements/readable/icon.png`;
    }
  }, [pathname, icon]);

  return null;
};

export default Favicon;
