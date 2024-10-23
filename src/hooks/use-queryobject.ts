import React from "react";
import { isEqual } from "lodash";

import { useLocation } from "react-router";

import { useHistory } from "@/services/history";

function searchParamsToObject(): Record<string, any> {
  const params = new URLSearchParams(location.search);
  let obj: Record<string, any> = {};
  for (const [key, value] of params.entries()) {
    try {
      obj[key] = JSON.parse(value);
    } catch {}
  }
  return obj;
}

export type QueryObjectMapper = (
  value: Record<string, any>
) => Record<string, any>;
export function useQueryObjectState(): [
  obj: Record<string, any>,
  setValue: (value: Record<string, any>) => void
] {
  const history = useHistory();

  const location = useLocation();

  // This means we compute the object every render, but it saves heavier components re-rendeirng.
  const initial = searchParamsToObject();
  const prevObjRef = React.useRef<Record<string, any>>(initial);
  const [obj, setObj] = React.useState<Record<string, any>>(initial);

  React.useLayoutEffect(() => {
    const obj = searchParamsToObject();

    if (!isEqual(obj, prevObjRef.current)) {
      setObj(obj);
      prevObjRef.current = obj;
    }
  }, [location.search]);

  const setValue = React.useCallback(
    (value: Record<string, any>) => {
      const newParams = new URLSearchParams();

      for (const key in value) {
        if (value[key] === undefined) {
          continue;
        }

        newParams.set(key, JSON.stringify(value[key]));
      }

      history.replace(`${location.pathname}?${newParams.toString()}`);
    },
    [history]
  );

  return [obj, setValue];
}
