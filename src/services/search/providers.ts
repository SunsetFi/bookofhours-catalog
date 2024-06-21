import { Observable, map } from "rxjs";
import { Container } from "microinject";

import sitemap, { isSiteMapNavItem } from "@/sitemap";

import { mapArrayItems } from "@/observables";

import { PageSearchProviderPipe, SearchProviderPipe } from "./types";

const pagesSearchProvider: SearchProviderPipe = (query) => {
  return query.pipe(
    map((query) =>
      sitemap
        .filter(isSiteMapNavItem)
        .filter((page) =>
          page.label.toLowerCase().includes(query.toLowerCase())
        )
        .map((page) => ({
          iconUrl: `http://localhost:8081/api/compendium/elements/${page.iconName}/icon.png`,
          label: page.label,
          path: page.path,
        }))
    )
  );
};

const providers = [
  pagesSearchProvider,
  ...sitemap
    .filter(isSiteMapNavItem)
    .filter((x) => x.searchProvider != null)
    .map((x) => pageProviderFromPath(x.searchProvider!, x.path)),
];

function pageProviderFromPath(
  pageProvider: PageSearchProviderPipe,
  path: string
) {
  return (query: Observable<string>, container: Container) => {
    return pageProvider(query, container).pipe(
      mapArrayItems((item) => ({ ...item, path }))
    );
  };
}

export default providers;
