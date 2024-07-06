import { map } from "rxjs";

import { furnishingAspects } from "@/aspects";

import { createElementStackSearchProvider } from "@/services/search";

export const furnishingsSearchProvider = createElementStackSearchProvider(
  furnishingAspects,
  (element) =>
    element.label$.pipe(
      map((label) =>
        label ? `filter-label=\"${encodeURIComponent(label)}\"` : null
      )
    )
);
