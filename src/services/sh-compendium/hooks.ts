import { useDIDependency } from "@/container";

import { Compendium } from "./Compendium";
import { AspectModel } from "./models/AspectModel";

export function useAspect(aspectId: string): AspectModel {
  const compendium = useDIDependency(Compendium);
  return compendium.getAspectById(aspectId);
}
