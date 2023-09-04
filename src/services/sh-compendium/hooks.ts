import { useDIDependency } from "@/container";
import { useObservation } from "@/observables";

import { Compendium } from "./Compendium";
import { AspectModel } from "./models/AspectModel";

export function useAspects(): readonly AspectModel[] {
  const compendium = useDIDependency(Compendium);
  return useObservation(compendium.aspects$) ?? [];
}

export function useAspect(aspectId: string): AspectModel {
  const compendium = useDIDependency(Compendium);
  return compendium.getAspectById(aspectId);
}
