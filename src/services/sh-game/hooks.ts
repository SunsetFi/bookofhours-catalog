import { map } from "rxjs";

import { useDIDependency } from "@/container";
import { observeAll, useObservation } from "@/observables";

import { TokensSource } from "./sources/TokensSource";

export function useUnlockedLocationLabels() {
  const tokensSource = useDIDependency(TokensSource);
  return useObservation(
    () =>
      tokensSource.unlockedTerrains$.pipe(
        map((terrains) => terrains.map((terrain) => terrain.label$)),
        observeAll()
      ),
    [tokensSource]
  );
}
