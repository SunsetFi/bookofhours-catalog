import { useDIDependency } from "@/container";
import { observeAllMap } from "@/observables";

import { useObservation } from "@/hooks/use-observation";

import { TokensSource } from "./sources/TokensSource";

export function useUnlockedLocationLabels() {
  const tokensSource = useDIDependency(TokensSource);
  return useObservation(
    () =>
      tokensSource.unlockedTerrains$.pipe(
        observeAllMap((terrain) => terrain.label$)
      ),
    [tokensSource]
  );
}
