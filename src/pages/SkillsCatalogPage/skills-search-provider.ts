import { map } from "rxjs";

import { createElementStackSearchProvider } from "@/services/search";

export const skillsSearchProvider = createElementStackSearchProvider(
  "skill",
  (element) =>
    element.label$.pipe(
      map((label) => (label ? `label=\"${encodeURIComponent(label)}\"` : null))
    )
);
