import { Observable } from "rxjs";

import { useDIDependency } from "@/container";

import { filterItemObservations, useObservation } from "@/observables";

import { GameModel } from "./GameModel";
import { ElementStackModel } from "./ElementStackModel";

export function useLegacy(): string | null {
  const monitor = useDIDependency(GameModel);
  return useObservation(monitor.legacyId$) ?? null;
}

export function useVisibleElementStacks(
  filter?: (item: ElementStackModel) => Observable<boolean>,
  deps?: any[]
): readonly ElementStackModel[] {
  const monitor = useDIDependency(GameModel);
  return (
    useObservation(
      () =>
        filter
          ? monitor.visibleElementStacks$.pipe(filterItemObservations(filter))
          : monitor.visibleElementStacks$,
      [monitor, deps ? [...deps] : filter]
    ) ?? []
  );
}
