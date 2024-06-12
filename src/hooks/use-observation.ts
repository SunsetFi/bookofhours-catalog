import React from "react";

import { Observable } from "rxjs";

export function useObservation<T>(observable: Observable<T>): T | undefined;
export function useObservation<T>(
  factory: () => Observable<T>,
  deps?: any[]
): T | undefined;
export function useObservation<T>(
  observableOrFactory: Observable<T> | (() => Observable<T>),
  deps?: any[]
) {
  const factory = React.useMemo(
    () =>
      typeof observableOrFactory === "function"
        ? observableOrFactory
        : () => observableOrFactory,
    deps ? [...deps] : [observableOrFactory]
  );

  const [value, setValue] = React.useState<T | undefined>(undefined);

  // Using LayoutEffect guarentees we get a value before render.
  // This is useful when we know the observable is warmed up and we want the value on the very first render.
  React.useLayoutEffect(() => {
    const sub = factory().subscribe((value) => setValue(value));
    return () => sub.unsubscribe();
  }, [factory]);

  return value;
}
