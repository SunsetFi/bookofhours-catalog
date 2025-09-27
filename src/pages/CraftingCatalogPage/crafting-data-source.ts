import React from "react";
import { Container } from "microinject";

import { first, mapValues } from "lodash";

import {
  BehaviorSubject,
  Observable,
  firstValueFrom,
  map,
  switchMap,
  shareReplay,
  combineLatest,
} from "rxjs";
import { Aspects } from "secrethistories-api";

import {
  Null$,
  filterItemObservations,
  mapArrayItemsCached,
  observeAllMap,
} from "@/observables";
import { useDIContainer } from "@/container";

import { Compendium, RecipeModel } from "@/services/sh-compendium";
import {
  CharacterSource,
  filterHasAnyAspect,
  Orchestrator,
  TokensSource,
} from "@/services/sh-game";

export interface CraftableModel {
  id: string;
  iconUrl$: Observable<string | null>;
  elementId$: Observable<string | null>;
  label$: Observable<string | null>;
  aspects$: Observable<Readonly<Aspects>>;
  skillElementId$: Observable<string | null>;
  skillLabel$: Observable<string | null>;
  requirements$: Observable<Readonly<Aspects>>;
  description$: Observable<string | null>;
  craft(): void;
}

const nullStringObservable = new BehaviorSubject<string | null>(null);
const nullAspectsObservable = new BehaviorSubject<Aspects>({});

function recipeToCraftableModel(
  recipeModel: RecipeModel,
  compendium: Compendium,
  orchestrator: Orchestrator,
): CraftableModel {
  const craftable$ = recipeModel.effects$.pipe(
    map((effects) =>
      first(Object.keys(effects).filter((x) => Number(effects[x]) > 0)),
    ),
    map((elementId) =>
      elementId ? compendium.getElementById(elementId) : null,
    ),
    shareReplay(1),
  );

  const skill$ = recipeModel.requirements$.pipe(
    map((reqs) => Object.keys(reqs).find((req) => req.startsWith("s."))),
    map((elementId) =>
      elementId ? compendium.getElementById(elementId) : null,
    ),
  );

  return {
    id: recipeModel.id,
    iconUrl$: craftable$.pipe(
      switchMap((element) => element?.iconUrl$ ?? Null$),
    ),
    elementId$: craftable$.pipe(map((element) => element?.elementId ?? null)),
    label$: craftable$.pipe(
      switchMap((element) => element?.label$ ?? nullStringObservable),
    ),
    aspects$: craftable$.pipe(
      switchMap((element) => element?.aspects$ ?? nullAspectsObservable),
    ),
    skillElementId$: skill$.pipe(map((element) => element?.elementId ?? null)),
    skillLabel$: skill$.pipe(
      switchMap((element) => element?.label$ ?? nullStringObservable),
    ),
    requirements$: recipeModel.requirements$.pipe(
      map((x) => mapValues(x, Number)),
    ),
    description$: recipeModel.startDescription$,
    craft: async () => {
      const skill = await firstValueFrom(skill$);
      if (!skill) {
        return;
      }

      orchestrator.openOrchestration({
        recipeId: recipeModel.id,
        desiredElementIds: skill ? [skill.elementId] : [],
      });
    },
  };
}

export function getCraftablesObservable(
  container: Container,
): Observable<CraftableModel[]> {
  const compendium = container.get(Compendium);
  const orchestrator = container.get(Orchestrator);
  const characterSource = container.get(CharacterSource);

  const skillIds$ = characterSource.skills$.pipe(
    observeAllMap((s) => s.elementId$),
  );

  return skillIds$.pipe(
    switchMap((skills) => {
      return characterSource.ambittableRecipes$.pipe(
        // The skill might have been removed with Numa, so we need to remove recipes that dont have matching skills
        filterItemObservations((item) =>
          item.requirements$.pipe(
            map((reqs) =>
              Object.keys(reqs).some((req) => skills.includes(req)),
            ),
          ),
        ),
        mapArrayItemsCached((item) =>
          recipeToCraftableModel(item, compendium, orchestrator),
        ),
      );
    }),
  );
}

export function useCraftables() {
  const container = useDIContainer();
  return React.useMemo(() => getCraftablesObservable(container), [container]);
}
