import { map } from "rxjs";

import { useDIDependency } from "@/container";
import { filterItemObservations, observeAllMap } from "@/observables";

import { useObservation } from "@/hooks/use-observation";

import { TokensSource } from "./sources/TokensSource";

export function useUnlockedLocationLabels() {
  const tokensSource = useDIDependency(TokensSource);
  return useObservation(
    () =>
      tokensSource.unsealedTerrains$.pipe(
        filterItemObservations((terrain) =>
          terrain.shrouded$.pipe(map((shrouded) => !shrouded)),
        ),
        observeAllMap((terrain) => terrain.label$),
      ),
    [tokensSource],
  );
}
