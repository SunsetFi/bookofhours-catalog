import {
  OperatorFunction,
  Observable,
  Subscription,
  map,
  distinctUntilChanged,
  switchMap,
  defer,
  from,
  shareReplay,
  BehaviorSubject,
  combineLatest,
} from "rxjs";

import { arrayShallowEquals, isNotNull } from "./utils";

export type ObservableKeys<T> = {
  [K in keyof T]: T[K] extends Observable<any> ? K : never;
}[keyof T];

export type Observation<T> = T extends Observable<infer K> ? K : never;

export const Null$: Observable<null> = new BehaviorSubject(null);
export const True$: Observable<true> = new BehaviorSubject(true);
export const False$: Observable<false> = new BehaviorSubject(false);
export const EmptyArray$: Observable<[]> = new BehaviorSubject([]);
export const EmptyObject$: Observable<{}> = new BehaviorSubject({});

export function observableObjectOrEmpty<T extends {}>(
  value: Observable<T> | null | undefined
): Observable<T> {
  if (value) {
    return value;
  }

  return EmptyObject$ as any;
}

export function promiseFuncToObservable<T>(
  func: () => Promise<T>
): Observable<T> {
  return defer(() => from(func())).pipe(shareReplay(1));
}

export function distinctUntilShallowArrayChanged() {
  return <T>(source: Observable<readonly T[]>): Observable<readonly T[]> => {
    return source.pipe(distinctUntilChanged(arrayShallowEquals));
  };
}

export function filterItems<T, K extends T>(
  filter: (item: T) => item is K
): OperatorFunction<readonly T[], readonly K[]>;
export function filterItems<T>(
  filter: (item: T) => boolean
): OperatorFunction<readonly T[], readonly T[]>;
export function filterItems(filter: (item: any) => boolean) {
  return (source: Observable<readonly any[]>): Observable<any[]> => {
    return source.pipe(map((items) => items.filter(filter)));
  };
}

export function firstOrDefault<TIn, TOut extends TIn>(
  filter: (item: TIn) => item is TOut
): OperatorFunction<readonly TIn[], TOut | null>;
export function firstOrDefault<TIn>(
  filter: (item: TIn) => boolean
): OperatorFunction<readonly TIn[], TIn | null>;
export function firstOrDefault<TIn, TOut extends TIn>(
  filter: (item: TIn) => boolean
): OperatorFunction<readonly TIn[], any | null> {
  return (source: Observable<readonly TIn[]>): Observable<any | null> => {
    return source.pipe(
      map((items) => items.find(filter) ?? null),
      distinctUntilChanged()
    );
  };
}

export function filterItemObservations<T, K extends T>(
  filter: (item: T) => Observable<boolean>
) {
  return (source: Observable<readonly T[]>): Observable<K[]> => {
    return source.pipe(
      mapArrayItemsCached((item) =>
        filter(item).pipe(map((isMatch) => ({ item, isMatch })))
      ),
      distinctUntilShallowArrayChanged(),
      observeAll(),
      map((items) =>
        items.filter(({ isMatch }) => isMatch).map(({ item }) => item as K)
      )
    );
  };
}

export function pickObservable<T, K extends ObservableKeys<T>>(key: K) {
  return (source: Observable<T>): Observable<Observation<T[K]>> => {
    return source.pipe(switchMap((value) => value[key] as any)) as any;
  };
}

export function observeAll<T>(): OperatorFunction<
  readonly Observable<T>[],
  T[]
>;
export function observeAll<T, K>(
  func: (value: T) => Observable<K>
): OperatorFunction<readonly T[], K[]>;
export function observeAll<T, K>(func?: (value: T) => Observable<K>) {
  if (func) {
    return (source: Observable<readonly T[]>) => {
      return source.pipe(
        map((inputs) => inputs.map((input) => func(input))),
        distinctUntilShallowArrayChanged(),
        switchMap((observables) => combineLatest(observables))
      );
    };
  } else {
    return (source: Observable<readonly Observable<T>[]>) => {
      return source.pipe(
        switchMap((observables) => combineLatest(observables))
      );
    };
  }
}

export function mapArrayItems<T, K>(mapping: (item: T) => K) {
  return (source: Observable<readonly T[]>): Observable<K[]> => {
    return source.pipe(map((items) => items.map(mapping)));
  };
}

export function switchMapIf<T, TM extends T, K>(
  condition: (value: T) => value is TM,
  mapping: (value: TM) => Observable<K> | Promise<K>,
  ifFalse: Observable<K>
) {
  return (source: Observable<T>): Observable<K> => {
    return source.pipe(
      switchMap((value) => (condition(value) ? mapping(value) : ifFalse))
    );
  };
}

export function switchMapIfNotNull<T, K>(
  mapping: (value: T) => Observable<K> | Promise<K>
) {
  return switchMapIf<T | null, T, K | null>(isNotNull, mapping, Null$);
}

export function mapArrayItemsCached<T, R>(
  fn: (value: T, index: number) => R
): OperatorFunction<readonly T[], R[]> {
  return (source: Observable<readonly T[]>): Observable<R[]> => {
    const cache = new Map<T, R>();

    return source.pipe(
      map((arr) => {
        // Temporary set to track items in the current array.
        const currentSet = new Set<T>();

        const result = arr.map((item, index) => {
          currentSet.add(item);

          if (cache.has(item)) {
            return cache.get(item)!;
          } else {
            const newValue = fn(item, index);
            cache.set(item, newValue);
            return newValue;
          }
        });

        // Remove items from the cache that aren't in the current array.
        for (const key of cache.keys()) {
          if (!currentSet.has(key)) {
            cache.delete(key);
          }
        }

        return result;
      })
    );
  };
}

export function profileDownstream(tag: string) {
  return <T>(source: Observable<T>): Observable<T> => {
    return new Observable<T>((subscriber) => {
      return source.subscribe((value) => {
        console.time(tag);
        subscriber.next(value);
        console.timeEnd(tag);
      });
    });
  };
}

const extantTimers = new Set<string>();
export function profileStart(tag: string) {
  return <T>(source: Observable<T>): Observable<T> => {
    return new Observable<T>((subscriber) => {
      return source.subscribe((value) => {
        if (!extantTimers.has(tag)) {
          extantTimers.add(tag);
          console.time(tag);
        }
        subscriber.next(value);
      });
    });
  };
}

export function profileEnd(tag: string) {
  return <T>(source: Observable<T>): Observable<T> => {
    return new Observable<T>((subscriber) => {
      return source.subscribe((value) => {
        if (extantTimers.delete(tag)) {
          console.timeEnd(tag);
        }
        subscriber.next(value);
      });
    });
  };
}
