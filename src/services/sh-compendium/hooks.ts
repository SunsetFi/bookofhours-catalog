import { Element } from "secrethistories-api";

import { useDIDependency } from "@/container";
import { useObservation } from "@/observables";

import { Compendium } from "./Compendium";

export function useAspect(aspectId: string): Element | null {
  const compendium = useDIDependency(Compendium);
  const aspects = useObservation(compendium.aspects$) ?? {};
  return aspects[aspectId] ?? null;
}
