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
  deps?: any[],
  opts?: UseObservationOpts
): T | undefined;
export function useObservation<T>(
  observableOrFactory: Observable<T> | (() => Observable<T>),
  deps?: any[],
  { onError, profileName }: UseObservationOpts = {}
) {
  const scheduler = useDIDependency(BatchingScheduler);

  // It turns out using suspense is unworkable because we rely on hooks to get the promise.
  // Suspense only works with exterior resources.
  // Technically, all of our stuff is exterior resources in our container,
  // but we often create observables on the fly using hooks.
  // const factory = React.useMemo(
  //   () => factoryToObservableResource(observableOrFactory, scheduler),
  //   deps ? [...deps] : [observableOrFactory]
  // );

  // return useObservableSuspense(factory);

  const observable$ = React.useMemo(
    () => factoryToObservable(observableOrFactory, scheduler),
    deps ? [...deps] : [observableOrFactory]
  );

  const [value, setValue] = React.useState<T | undefined>(undefined);
  const [err, setError] = React.useState<any>(null);

  // Using LayoutEffect guarentees we get a value before render.
  // This is useful when we know the observable is warmed up and we want the value on the very first render.
  React.useLayoutEffect(() => {
    let seenFirstValue = false;
    const start = Date.now();
    const sub = observable$.subscribe({
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
        if (profileName) console.log("Observation got value", value);
        setValue(value);
      },
      error: onError ?? setError,
    });
    return () => sub.unsubscribe();
  }, [observable$, onError]);

  if (err) {
    throw err;
  }

  return value;
}

function factoryToObservable<T>(
  factory: Observable<T> | (() => Observable<T>),
  scheduler: SchedulerLike
): Observable<T> {
  let observable: Observable<T>;
  if (typeof factory === "function") {
    observable = factory();
  } else {
    observable = factory;
  }

  return observable.pipe(publishOn(scheduler));
}

// function factoryToObservableResource<T>(
//   factory: Observable<T> | (() => Observable<T>),
//   scheduler: SchedulerLike
// ): ObservableResource<T> {
//   let observable: Observable<T>;
//   if (typeof factory === "function") {
//     observable = factory();
//   } else {
//     observable = factory;
//   }

//   return new ObservableResource(
//     observable.pipe(
//       publishOn(scheduler),
//       tap((v) => console.log("Observable got value", v))
//     )
//   );
// }
