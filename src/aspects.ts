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

export function aspectsMagnitude(aspects: Aspects): number {
  return Math.sqrt(
    Object.values(aspects).reduce((sum, value) => sum + value * value, 0)
  );
}
