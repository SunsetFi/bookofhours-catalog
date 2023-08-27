import { useObservableState } from "observable-hooks";

import { useDIDependency } from "@/container";

import { GameModel } from "./GameModel";
import { ElementStackModel } from "./ElementStackModel";

export function useLegacy(): string | null {
  const monitor = useDIDependency(GameModel);
  return useObservableState(monitor.legacyId$, null);
}

export function useVisibleElementStacks(): readonly ElementStackModel[] {
  const monitor = useDIDependency(GameModel);
  return useObservableState(monitor.visibleElementStacks$, []);
}

export function useVisibleReadables(): readonly ElementStackModel[] {
  const monitor = useDIDependency(GameModel);
  return useObservableState(monitor.visibleReadables$, []);
}
