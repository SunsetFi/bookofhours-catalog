import { map } from "rxjs";

import { createElementStackSearchProvider } from "@/services/search";

export const toolsSearchProvider = createElementStackSearchProvider(
  "tool",
  (element) =>
    element.label$.pipe(
      map((label) => (label ? `label=\"${encodeURIComponent(label)}\"` : null))
    )
);
