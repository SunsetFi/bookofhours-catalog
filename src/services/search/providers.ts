import { Observable, map } from "rxjs";
import { Container } from "microinject";
import { omit } from "lodash";

import sitemap, { isSiteMapNavItem } from "@/sitemap";

import { mapArrayItems } from "@/observables";

import {
  PageSearchProviderPipe,
  SearchProviderPipe,
  SearchQuery,
} from "./types";
import { matchesSearchQuery } from "./utils";

const pagesSearchProvider: SearchProviderPipe = (query) => {
  return query.pipe(
    map((query) =>
      sitemap
        .filter(isSiteMapNavItem)
        .filter((page) => matchesSearchQuery(query, { freeText: [page.label] }))
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
  return (query: Observable<SearchQuery>, container: Container) => {
    return pageProvider(query, container).pipe(
      mapArrayItems((item) => ({
        ...omit(item, "pathQuery"),
        path: `${path}?${item.pathQuery}`,
      }))
    );
  };
}

export default providers;
