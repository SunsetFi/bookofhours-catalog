import React from "react";
import { BehaviorSubject, Observable } from "rxjs";

export function useValueObservation<T>(value: T): Observable<T> {
  // Note: We do NOT want to take value as a dependency here, we just want to use it for the initial value.
  const observable$ = React.useMemo(() => new BehaviorSubject<T>(value), []);
  React.useEffect(() => {
    observable$.next(value);
  }, [value]);

  return observable$;
}
