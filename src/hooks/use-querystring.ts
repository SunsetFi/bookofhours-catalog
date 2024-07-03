import { useHistory } from "@/services/history";
import React from "react";

import { useLocation } from "react-router";

export function useQueryString(query: string): string | null {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  return params.get(query);
}

export function useQueryStringState(
  query: string
): [string | null, (value: string | null) => void] {
  const location = useLocation();
  const history = useHistory();
  const params = React.useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );
  const value = params.get(query);
  const setValue = React.useCallback(
    (value: string | null) => {
      if (value === null) {
        params.delete(query);
      } else {
        params.set(query, value);
      }
      history.replace(`${location.pathname}?${params.toString()}`);
    },
    [location.pathname, query, params]
  );

  return [value, setValue];
}
