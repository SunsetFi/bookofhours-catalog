import { useDIDependency } from "@/container";

import { useObservation } from "@/observables";

import { GameModel } from "./GameModel";

export function useIsRunning(): boolean | undefined {
  const model = useDIDependency(GameModel);
  return useObservation(model.isRunning$) ?? model.isRunning;
}

export function useYear() {
  const model = useDIDependency(GameModel);
  return useObservation(model.year$) ?? model.year;
}

export function useSeason() {
  const model = useDIDependency(GameModel);
  return useObservation(model.season$) ?? model.season;
}
