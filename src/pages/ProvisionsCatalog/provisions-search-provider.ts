import { map } from "rxjs";

import { provisionsAspects } from "@/aspects";

import { createElementStackSearchProvider } from "@/services/search";

export const provisionsSearchProvider = createElementStackSearchProvider(
  provisionsAspects,
  (element) =>
    element.label$.pipe(
      map((label) =>
        label ? `filter-label=\"${encodeURIComponent(label)}\"` : null,
      ),
    ),
);
