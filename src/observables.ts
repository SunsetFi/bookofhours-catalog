import {
  OperatorFunction,
  Observable,
  Subscription,
  map,
  distinctUntilChanged,
  mergeMap,
  defer,
  from,
  shareReplay,
  BehaviorSubject,
} from "rxjs";

import { arrayShallowEquals, isNotNull } from "./utils";

export type ObservableKeys<T> = {
  [K in keyof T]: T[K] extends Observable<any> ? K : never;
}[keyof T];

export type Observation<T> = T extends Observable<infer K> ? K : never;

export const Null$: Observable<null> = new BehaviorSubject(null);
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
    return source.pipe(mergeMap((value) => value[key] as any)) as any;
  };
}

export function observeAll() {
  return <K>(source: Observable<readonly Observable<K>[]>) => {
    return new Observable<K[]>((subscriber) => {
      const subscriberMap = new Map<
        Observable<K>,
        { subscription: Subscription; lastValue: K | undefined }
      >();
      let lastValues: readonly Observable<K>[] = [];
      let isSubscribing = false;

      function tryEmitValues() {
        if (isSubscribing) {
          return;
        }

        const values = lastValues.map(
          (value) => subscriberMap.get(value)?.lastValue
        );

        if (values.some((value) => value === undefined)) {
          return;
        }

        // In practice this is called a bonkers number of times even after we get all values.
        // Books page does this particularly... Need a distinct somewhere?
        subscriber.next(values as any);
      }

      function subscribeToChild(observable: Observable<K>) {
        const values = {
          subscription: undefined as any,
          lastValue: undefined as K | undefined,
        };

        // This must be set before we subscribe as cold observables will give us a value immediately.
        subscriberMap.set(observable, values);
        values.subscription = observable.subscribe({
          next: (value) => {
            values.lastValue = value;
            tryEmitValues();
          },
          error: (err) => {
            subscriber.error(err);
          },
          // Don't care about complete, it will stick to its last value forever.
          // Note: If we never got a value, we will be stuck waiting for the undefined value forever.... maybe do something about that.
        });
      }

      function trySubscribe(observable: Observable<K>) {
        if (!subscriberMap.has(observable)) {
          subscribeToChild(observable);
          return true;
        }

        return false;
      }

      function clearOldSubscriptions(values: readonly Observable<K>[]) {
        let cleared = 0;
        for (const [observable, { subscription }] of subscriberMap.entries()) {
          if (!values.includes(observable)) {
            cleared++;
            subscription.unsubscribe();
            subscriberMap.delete(observable);
          }
        }
        return cleared > 0;
      }

      function onTopLevelUpdate(values: readonly Observable<K>[]) {
        let emit = false;
        try {
          isSubscribing = true;

          emit = clearOldSubscriptions(values);
          for (const value of values) {
            if (trySubscribe(value)) {
              emit = true;
            }
          }

          lastValues = values;
        } finally {
          isSubscribing = false;
        }

        if (emit || values.length === 0) {
          tryEmitValues();
        }
      }

      const topLevelSubscription = source.subscribe({
        next: onTopLevelUpdate,
        error: (err) => subscriber.error(err),
        complete: () => subscriber.complete(),
      });

      return () => {
        for (const { subscription } of subscriberMap.values()) {
          subscription.unsubscribe();
        }

        topLevelSubscription.unsubscribe();
      };
    });
  };
}

export function mapArrayItems<T, K>(mapping: (item: T) => K) {
  return (source: Observable<readonly T[]>): Observable<K[]> => {
    return source.pipe(map((items) => items.map(mapping)));
  };
}

export function mergeMapIf<T, TM extends T, K>(
  condition: (value: T) => value is TM,
  mapping: (value: TM) => Observable<K> | Promise<K>,
  ifFalse: Observable<K>
) {
  return (source: Observable<T>): Observable<K> => {
    return source.pipe(
      mergeMap((value) => (condition(value) ? mapping(value) : ifFalse))
    );
  };
}

export function mergeMapIfNotNull<T, K>(
  mapping: (value: T) => Observable<K> | Promise<K>
) {
  return mergeMapIf<T | null, T, K | null>(isNotNull, mapping, Null$);
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
