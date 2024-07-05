import { map } from "rxjs";

import { createElementStackSearchProvider } from "@/services/search";

export const bookCatalogSearchProvider = createElementStackSearchProvider(
  "readable",
  (element) =>
    element.label$.pipe(
      map((label) => (label ? `label=\"${encodeURIComponent(label)}\"` : null))
    )
);
