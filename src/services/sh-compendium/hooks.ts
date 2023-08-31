import { useDIDependency } from "@/container";
import { useObservation } from "@/observables";

import { Compendium } from "./Compendium";
import { AspectModel } from "./AspectModel";

export function useAspect(aspectId: string): AspectModel | null {
  const compendium = useDIDependency(Compendium);
  const aspects = useObservation(compendium.aspects$) ?? {};
  return aspects[aspectId] ?? null;
}

export function useAspects(): AspectModel[] {
  const compendium = useDIDependency(Compendium);
  const aspects = useObservation(compendium.aspects$) ?? {};
  return Object.values(aspects);
}
