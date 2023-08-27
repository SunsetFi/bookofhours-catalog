import { useObservableState } from "observable-hooks";
import { Element } from "secrethistories-api";

import { useDIDependency } from "@/container";

import { Compendium } from "./Compendium";

export function useAspect(aspectId: string): Element | null {
  const compendium = useDIDependency(Compendium);
  const aspects = useObservableState(compendium.aspects$, {});
  return aspects[aspectId] ?? null;
}
