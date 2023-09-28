import { Aspects } from "secrethistories-api";

export const powerAspects = [
  "edge",
  "forge",
  "grail",
  "heart",
  "knock",
  "lantern",
  "moon",
  "moth",
  "nectar",
  "rose",
  "scale",
  "sky",
  "winter",
] as const;

export const materialAspects = [
  "material",
  "leaf",
  "flower",
  "liquid",
  "pigment",
  "metal",
  "fuel",
  "remains",
  "gem",
  "fabric",
  "glass",
  "ink", // not really a material, but it needs to be somewhere.
  "metal",
  "egg",
  "candle",
] as const;

export const provisionsAspects = [
  "beverage",
  "brewable",
  "sustenance",
  "distributable",
] as const;

export const workstationFilterAspects = [
  ...powerAspects,
  ...materialAspects,
  "ability",
  "memory",
];

export const furnishingAspects = ["comfort", "wallart"] as const;

export function aspectsMagnitude(aspects: Aspects): number {
  return Math.sqrt(
    Object.values(aspects).reduce((sum, value) => sum + value * value, 0)
  );
}

export function aspectOrder(aspect: string) {
  if (powerAspects.includes(aspect as any)) {
    return 0;
  } else if (materialAspects.includes(aspect as any)) {
    return 1;
  }
}
