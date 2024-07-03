import React from "react";

import { useLocation } from "react-router";

import { useHistory } from "@/services/history";

export type QueryObjectMapper = (
  value: Record<string, any>
) => Record<string, any>;
export function useQueryObjectState(
  mapping: { fromUrl?: QueryObjectMapper; toUrl?: QueryObjectMapper } = {}
): [obj: Record<string, any>, setValue: (value: Record<string, any>) => void] {
  const history = useHistory();

  const location = useLocation();

  const [obj, setObj] = React.useState<Record<string, any>>({});

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    let obj: Record<string, any> = {};
    for (const [key, value] of params.entries()) {
      try {
        obj[key] = JSON.parse(value);
      } catch {}
    }

    if (mapping.fromUrl) {
      obj = mapping.fromUrl(obj);
    }

    setObj(obj);
  }, [location, mapping.fromUrl ?? null]);

  const setValue = React.useCallback(
    (value: Record<string, any>) => {
      const newParams = new URLSearchParams();
      if (mapping.toUrl) {
        value = mapping.toUrl(value);
      }

      for (const key in value) {
        newParams.set(key, JSON.stringify(value[key]));
      }

      history.replace(`${location.pathname}?${newParams.toString()}`);
    },
    [location, history, mapping.toUrl ?? null]
  );

  return [obj, setValue];
}
