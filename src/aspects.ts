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
] as const;

export const provisionsAspects = [
  "beverage",
  "brewable",
  "sustanance",
] as const;

export const furnishingAspects = ["comfort", "wallart"] as const;

export function aspectsMagnitude(aspects: Aspects): number {
  return Math.sqrt(
    Object.values(aspects).reduce((sum, value) => sum + value * value, 0)
  );
}
