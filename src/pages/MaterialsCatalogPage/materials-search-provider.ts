import { map } from "rxjs";

import { materialAspects } from "@/aspects";

import { createElementStackSearchProvider } from "@/services/search";

export const materialsSearchProvider = createElementStackSearchProvider(
  materialAspects,
  (element) =>
    element.label$.pipe(
      map((label) => (label ? `label=\"${encodeURIComponent(label)}\"` : null))
    )
);
