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
  "egg",
  "candle",
] as const;

export const provisionsAspects = [
  "beverage",
  "brewable",
  "sustenance",
  "distributable",
] as const;

export const courseAspects = [
  "course.first",
  "course.main",
  "course.side",
  "course.pudding",
];

export const venueAspects = [
  "venue.formal",
  "venue.informal",
  "venue.picnicking",
];

// FIXME: Temp hack, we should probably pull this from the aspect model
export const venueAspectLabels: Record<
  ArrayItemOf<typeof venueAspects>,
  string
> = {
  "venue.formal": "Formal",
  "venue.informal": "Informal",
  "venue.picnicking": "Picnicking",
};

export const workstationFilterAspects = [
  ...powerAspects,
  ...materialAspects,
  "ability",
  "memory",
];

export const furnishingAspects = ["comfort", "wallart"] as const;

export const evolutionAspects = [
  "e.illumination",
  "e.horomachistry",
  "e.ithastry",
  "e.hushery",
  "e.nyctodromy",
  "e.skolekosophy",
  "e.birdsong",
  "e.bosk",
  "e.preservation",
] as const;

export const wisdomAspects = [
  "w.illumination",
  "w.horomachistry",
  "w.ithastry",
  "w.hushery",
  "w.nyctodromy",
  "w.skolekosophy",
  "w.birdsong",
  "w.bosk",
  "w.preservation",
];

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
