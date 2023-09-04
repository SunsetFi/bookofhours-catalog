import * as React from "react";

import {
  combineLatest,
  OperatorFunction,
  Observable,
  Subscription,
  map,
  distinctUntilChanged,
  mergeMap,
  defer,
  from,
  shareReplay,
} from "rxjs";

export type ObservableKeys<T> = {
  [K in keyof T]: T[K] extends Observable<any> ? K : never;
}[keyof T];

export type Observation<T> = T extends Observable<infer K> ? K : never;

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

  React.useEffect(() => {
    const sub = factory().subscribe((value) => setValue(value));
    return () => sub.unsubscribe();
  }, [factory]);

  return value;
}

export function promiseFuncToObservable<T>(
  func: () => Promise<T>
): Observable<T> {
  return defer(() => from(func())).pipe(shareReplay(1));
}

export function distinctUntilShallowArrayChanged() {
  return (source: Observable<readonly any[]>): Observable<readonly any[]> => {
    return source.pipe(distinctUntilChanged(arrayShallowEquals));
  };
}

function arrayShallowEquals<T>(a: readonly T[], b: readonly T[]) {
  if (a.length !== b.length) {
    return false;
  }

  return a.every((x, i) => x === b[i]);
}

export function filterItems<T, K extends T>(filter: (item: T) => item is K) {
  return (source: Observable<readonly T[]>): Observable<K[]> => {
    return source.pipe(map((items) => items.filter(filter)));
  };
}

export function filterItemObservations<T, K extends T>(
  filter: (item: T) => Observable<boolean>
) {
  return (source: Observable<readonly T[]>): Observable<K[]> => {
    return source.pipe(
      map((items) =>
        items.map((item) =>
          filter(item).pipe(map((isMatch) => ({ item, isMatch })))
        )
      ),
      observeAll(),
      map((items) =>
        items.filter(({ isMatch }) => isMatch).map(({ item }) => item as K)
      )
    );
  };
}

export function mapItems<T, K>(mapping: (item: T) => K) {
  return (source: Observable<readonly T[]>): Observable<K[]> => {
    return source.pipe(map((items) => items.map(mapping)));
  };
}

export function pickObservable<T, K extends ObservableKeys<T>>(key: K) {
  return (source: Observable<T>): Observable<Observation<T[K]>> => {
    return source.pipe(mergeMap((value) => value[key] as any)) as any;
  };
}

// WARN: I have faint memories of memory leaks around this code.  Be careful.
export function observeAll<K>(): OperatorFunction<Observable<K>[], K[]> {
  return (source: Observable<Observable<K>[]>) => {
    return new Observable<K[]>((subscriber) => {
      let combineLatestSub: Subscription | null = null;
      const sourceSub = source.subscribe({
        next: (observables) => {
          if (combineLatestSub) {
            combineLatestSub.unsubscribe();
            combineLatestSub = null;
          }

          if (observables.length === 0) {
            subscriber.next([]);
            return;
          }

          combineLatestSub = combineLatest(observables).subscribe((values) => {
            subscriber.next(values);
          });
        },
        complete: () => {
          if (combineLatestSub) {
            combineLatestSub.unsubscribe();
          }
          subscriber.complete();
        },
        error: (err) => {
          if (combineLatestSub) {
            combineLatestSub.unsubscribe();
          }
          subscriber.error(err);
        },
      });

      subscriber.add(() => {
        if (combineLatestSub) {
          combineLatestSub.unsubscribe();
        }
        sourceSub.unsubscribe();
      });

      return () => {
        if (combineLatestSub) {
          subscriber.remove(combineLatestSub);
          combineLatestSub.unsubscribe();
        }
        sourceSub.unsubscribe();
      };
    });
  };
}
