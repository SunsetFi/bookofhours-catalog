import React from "react";
import { Observable, SchedulerLike, tap } from "rxjs";
// import { ObservableResource, useObservableSuspense } from "observable-hooks";

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
  deps: any[],
  opts?: UseObservationOpts,
): T | undefined;
export function useObservation<T>(
  observableOrFactory: Observable<T> | (() => Observable<T>),
  deps?: any[],
  { onError, profileName }: UseObservationOpts = {},
) {
  const scheduler = useDIDependency(BatchingScheduler);

  const observable$ = React.useMemo(
    () => factoryToObservable(observableOrFactory, scheduler),
    deps ? [...deps] : [observableOrFactory],
  );

  // Do this in realtime, don't mess about with effects.
  // This will get us the value for the very first render, if one is available.

  const [value, setValue] = React.useState<T | undefined>(undefined);
  const [err, setError] = React.useState<any>(null);

  const initialValueRef = React.useRef<T | undefined>(undefined);

  const hasMountedRef = React.useRef(false);
  React.useEffect(() => {
    hasMountedRef.current = true;
    return () => {
      hasMountedRef.current = false;
    };
  }, []);

  const subscribedObservableRef = React.useRef<Observable<T> | null>(null);
  const subscriptionRef = React.useRef<null | { unsubscribe(): void }>(null);

  if (subscribedObservableRef.current !== observable$) {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
    subscribedObservableRef.current = observable$;
  }

  if (subscriptionRef.current == null) {
    let seenFirstValue = false;
    const start = Date.now();
    const sub = observable$.subscribe({
      next: (value) => {
        if (!seenFirstValue) {
          seenFirstValue = true;
          if (profileName)
            console.trace(
              "PERF",
              profileName,
              "retrieved first value in ",
              (Date.now() - start) / 1000,
              "s",
            );
        }

        if (!hasMountedRef.current) {
          initialValueRef.current = value;
          return;
        }

        initialValueRef.current = undefined;
        setValue(value);
      },
      error: onError ?? setError,
    });

    subscriptionRef.current = sub;
  }

  React.useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, []);

  if (err) {
    throw err;
  }

  return initialValueRef.current ?? value;
}

function factoryToObservable<T>(
  factory: Observable<T> | (() => Observable<T>),
  scheduler: SchedulerLike,
): Observable<T> {
  let observable: Observable<T>;
  if (typeof factory === "function") {
    observable = factory();
  } else {
    observable = factory;
  }

  return observable.pipe(publishOn(scheduler));
}
