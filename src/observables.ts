import {
  combineLatest,
  OperatorFunction,
  Observable,
  Subscription,
  Subject,
} from "rxjs";

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
