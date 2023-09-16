import * as React from "react";

import { createContext, useContextSelector } from "use-context-selector";

// We need to tunnel filter values into the headers, and invalidating all col defs takes a heavy toll.  Use context instead
export const FilterValueContext = createContext<Record<string, any>>({});
export const FilterDispatchContext = React.createContext<
  (key: string, value: any) => void
>(() => {});

export function useSetFilterValue(filterName: string | null) {
  const setter = React.useContext(FilterDispatchContext);
  return React.useCallback(
    (value: any) => {
      if (filterName == null) {
        return;
      }

      setter(filterName, value);
    },
    [setter, filterName]
  );
}

export function useFilterValue(filterName: string | null): any {
  const filterValue = useContextSelector(FilterValueContext, (filterValue) =>
    filterName ? filterValue[filterName] : null
  );
  return filterValue;
}
