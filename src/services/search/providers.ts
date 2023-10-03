import { map } from "rxjs";

import sitemap from "@/sitemap";

import { SearchProviderPipe } from "./types";
import { isNotNull } from "@/utils";

const pagesSearchProvider: SearchProviderPipe = (query) => {
  return query.pipe(
    map((query) =>
      sitemap
        .filter((page) =>
          page.label.toLowerCase().includes(query.toLowerCase())
        )
        .map((page) => ({
          iconUrl: `http://localhost:8081/api/compendium/elements/${page.aspectIcon}/icon.png`,
          label: page.label,
          path: page.path,
        }))
    )
  );
};

const providers = [
  pagesSearchProvider,
  ...sitemap.map((x) => x.searchProvider).filter(isNotNull),
];

export default providers;
