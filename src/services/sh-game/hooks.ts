import { useDIDependency } from "@/container";

import { useObservation } from "@/observables";

import { GameModel } from "./GameModel";
import { GameSpeed } from "secrethistories-api";

export function useIsRunning(): boolean | undefined {
  const model = useDIDependency(GameModel);
  return useObservation(model.isRunning$) ?? model.isRunning;
}

export function useGameSpeed(): GameSpeed | null {
  const model = useDIDependency(GameModel);
  return useObservation(model.gameSpeed$) ?? null;
}
