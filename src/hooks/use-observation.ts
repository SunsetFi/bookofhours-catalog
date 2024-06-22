import React from "react";
import { Observable } from "rxjs";

import { useDIDependency } from "@/container";

import { publishOn } from "@/observables";

import { BatchingScheduler } from "@/services/scheduler";

export interface UseObservationOpts {
  onError?(error: any): void;
  profileName?: string;
}

export function useObservation<T>(observable: Observable<T>): T | undefined;
export function useObservation<T>(
  factory: () => Observable<T>,
  deps?: any[],
  opts?: UseObservationOpts
): T | undefined;
export function useObservation<T>(
  observableOrFactory: Observable<T> | (() => Observable<T>),
  deps?: any[],
  { onError, profileName }: UseObservationOpts = {}
) {
  const scheduler = useDIDependency(BatchingScheduler);

  const factory = React.useMemo(
    () =>
      typeof observableOrFactory === "function"
        ? observableOrFactory
        : () => observableOrFactory,
    deps ? [...deps] : [observableOrFactory]
  );

  const [value, setValue] = React.useState<T | undefined>(undefined);
  const [err, setError] = React.useState<any>(null);

  // Using LayoutEffect guarentees we get a value before render.
  // This is useful when we know the observable is warmed up and we want the value on the very first render.
  React.useLayoutEffect(() => {
    let seenFirstValue = false;
    const start = Date.now();
    const sub = factory()
      .pipe(publishOn(scheduler))
      .subscribe({
        next: (value) => {
          if (!seenFirstValue) {
            seenFirstValue = true;
            if (profileName)
              console.log(
                "PERF",
                profileName,
                "retrieved first value in ",
                (Date.now() - start) / 1000,
                "s"
              );
          }
          setValue(value);
        },
        error: onError ?? setError,
      });
    return () => sub.unsubscribe();
  }, [factory, onError]);

  if (err) {
    throw err;
  }

  return value;
}
