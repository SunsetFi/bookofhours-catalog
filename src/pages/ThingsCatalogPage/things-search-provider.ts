import { map } from "rxjs";

import { createElementStackSearchProvider } from "@/services/search";

export const thingsSearchProvider = createElementStackSearchProvider(
  "thing",
  (element) =>
    element.label$.pipe(
      map((label) => (label ? `label=\"${encodeURIComponent(label)}\"` : null))
    )
);
