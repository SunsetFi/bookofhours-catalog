import React from "react";
import { Container } from "microinject";

import { useDIContainer } from "@/container";
import { CharacterSource } from "@/services/sh-game";
import { filterItems } from "@/observables";

function getCookablesObservable(container: Container) {
  const characterSource = container.get(CharacterSource);

  return characterSource.ambittableRecipes$.pipe(
    // Making the assumption that all cooking recipes start with this, as we have no real way to identify them otherwise.
    filterItems((recipe) => recipe.id.startsWith("cook."))
  );
}

export function useCookables() {
  const container = useDIContainer();
  return React.useMemo(() => getCookablesObservable(container), [container]);
}
