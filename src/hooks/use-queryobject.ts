import * as React from "react";

import { useLocation } from "react-router";

import { useHistory } from "@/services/history/hooks";

export function useQueryObjectState(): [
  obj: Record<string, any>,
  setValue: (value: Record<string, any>) => void
] {
  const location = useLocation();
  const history = useHistory();
  const params = new URLSearchParams(location.search);

  const [obj, setObj] = React.useState<Record<string, any>>({});

  React.useEffect(() => {
    const obj: Record<string, any> = {};
    for (const [key, value] of params.entries()) {
      try {
        obj[key] = JSON.parse(value);
      } catch {}
    }

    setObj(obj);
  }, [location]);

  const setValue = React.useCallback(
    (value: Record<string, any>) => {
      const newParams = new URLSearchParams();
      for (const key in value) {
        newParams.set(key, JSON.stringify(value[key]));
      }
      history.replace(`${location.pathname}?${newParams.toString()}`);
    },
    [location, history]
  );

  return [obj, setValue];
}
