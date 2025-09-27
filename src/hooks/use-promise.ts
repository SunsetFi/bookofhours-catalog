import React from "react";

export function usePromise<T>(promice: Promise<T>): T | undefined;
export function usePromise<T>(
  factory: () => Promise<T>,
  deps?: any[],
): T | undefined;
export function usePromise<T>(
  promiseOrFactory: Promise<T> | (() => Promise<T>),
  deps?: any[],
) {
  const factory = React.useMemo(
    () =>
      typeof promiseOrFactory === "function"
        ? promiseOrFactory
        : () => promiseOrFactory,
    deps ? [...deps] : [promiseOrFactory],
  );

  const [value, setValue] = React.useState<T | undefined>(undefined);

  React.useLayoutEffect(() => {
    let active = true;
    async function execute() {
      if (!active) {
        return;
      }

      let result: any;
      try {
        result = await factory();
      } catch (e) {
        console.error(e);
        return;
      }

      setValue(result);
    }

    execute();

    return () => {
      active = false;
    };
  }, [factory]);

  return value;
}
