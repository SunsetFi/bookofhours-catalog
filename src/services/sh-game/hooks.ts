import { useDIDependency } from "@/container";

import { useObservation } from "@/observables";

import { GameModel } from "./GameModel";

export function useIsRunning(): boolean | undefined {
  const model = useDIDependency(GameModel);
  return useObservation(`isRunning`, model.isRunning$) ?? model.isRunning;
}

export function useYear() {
  const model = useDIDependency(GameModel);
  return useObservation(`useYear`, model.year$) ?? model.year;
}

export function useSeason() {
  const model = useDIDependency(GameModel);
  return useObservation(`useSeason`, model.season$) ?? model.season;
}
