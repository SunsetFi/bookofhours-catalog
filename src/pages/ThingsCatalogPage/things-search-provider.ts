import { map } from "rxjs";

import { createElementStackSearchProvider } from "@/services/search";

export const thingsSearchProvider = createElementStackSearchProvider(
  (elementStack) =>
    elementStack.aspects$.pipe(
      map((aspects) => Boolean(aspects["thing"] && !aspects["readable"]))
    ),
  (element) =>
    element.label$.pipe(
      map((label) =>
        label ? `filter-label=\"${encodeURIComponent(label)}\"` : null
      )
    )
);
