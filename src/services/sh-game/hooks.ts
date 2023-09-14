import { useDIDependency } from "@/container";

import { useObservation } from "@/observables";

import { GameModel } from "./GameModel";

export function useIsRunning(): boolean | undefined {
  const model = useDIDependency(GameModel);
  return useObservation(model.isRunning$) ?? model.isRunning;
}
