import * as React from "react";
import { Container } from "microinject";

import { pick, first } from "lodash";
import { Observable, combineLatest, map, mergeMap } from "rxjs";
import { Aspects } from "secrethistories-api";

import { useDIContainer } from "@/container";

import { powerAspects } from "@/aspects";

import {
  Null$,
  mapArrayItemsCached,
  mergeMapIfNotNull,
  observableObjectOrEmpty,
} from "@/observables";

import { Compendium } from "@/services/sh-compendium";

import {
  ElementStackModel,
  ModelWithAspects,
  ModelWithDescription,
  ModelWithIconUrl,
  ModelWithLabel,
  ModelWithParentTerrain,
  Orchestrator,
  TokensSource,
  filterHasAspect,
} from "@/services/sh-game";

export interface BookModel
  extends ModelWithAspects,
    ModelWithDescription,
    ModelWithIconUrl,
    ModelWithLabel,
    ModelWithParentTerrain {
  id: string;
  token: ElementStackModel;
  memoryElementId$: Observable<string | null>;
  memoryLabel$: Observable<string | null>;
  memoryAspects$: Observable<Aspects>;
  read(): void;
}

function elementStackToBook(
  elementStack: ElementStackModel,
  compendium: Compendium,
  orchestrator: Orchestrator
): BookModel {
  const memory$ = combineLatest([
    elementStack.aspects$,
    elementStack.element$,
  ]).pipe(
    mergeMap(([aspects, element]) => {
      const mastery = Object.keys(aspects).find((aspectId) =>
        aspectId.startsWith("mastery.")
      );
      if (!mastery || aspects[mastery] < 1) {
        return Null$;
      }

      return element.xtriggers$.pipe(
        map((xtriggers) => {
          for (var key of Object.keys(xtriggers).filter((x) =>
            x.startsWith("reading.")
          )) {
            return first(xtriggers[key])?.id ?? null;
          }

          return null;
        })
      );
    }),
    map((memoryId) => (memoryId ? compendium.getElementById(memoryId) : null))
  );

  const memoryElementId$ = memory$.pipe(
    map((memory) => memory?.elementId ?? null)
  );
  const memoryLabel$ = memory$.pipe(
    mergeMapIfNotNull((memory) => memory.label$)
  );

  const memoryAspects$ = memory$.pipe(
    mergeMap((memory) =>
      observableObjectOrEmpty(memory?.aspects$).pipe(
        map((aspects) => pick(aspects, powerAspects))
      )
    )
  );

  return {
    get id() {
      return elementStack.id;
    },
    token: elementStack,
    get label$() {
      return elementStack.label$;
    },
    get description$() {
      return elementStack.description$;
    },
    get iconUrl() {
      return elementStack.iconUrl;
    },
    get aspects$() {
      return elementStack.aspects$;
    },
    get parentTerrain$() {
      return elementStack.parentTerrain$;
    },
    memoryElementId$,
    memoryLabel$,
    memoryAspects$,
    read: () => {
      const mystery = extractMysteryAspect(elementStack.aspects);
      const isMastered = Object.keys(elementStack.aspects).some((aspectId) =>
        aspectId.startsWith("mastery.")
      );
      orchestrator.requestOrchestration({
        recipeId: isMastered
          ? `study.mystery.${mystery}.mastered`
          : `study.mystery.${mystery}.mastering.begin`,
        desiredElementIds: [elementStack.elementId],
      });
    },
  };
}

function extractMysteryAspect(aspects: Aspects): string | null {
  let mystery = Object.keys(aspects).find((aspectId) =>
    aspectId.startsWith("mystery.")
  );
  if (!mystery) {
    return null;
  }

  return mystery.substring(8);
}

export function getBooksObservable(
  container: Container
): Observable<BookModel[]> {
  const compendium = container.get(Compendium);
  const orchestrator = container.get(Orchestrator);
  const tokensSource = container.get(TokensSource);

  return tokensSource.visibleElementStacks$.pipe(
    filterHasAspect("readable"),
    mapArrayItemsCached((item) =>
      elementStackToBook(item, compendium, orchestrator)
    )
  );
}

export function useBooks() {
  const container = useDIContainer();
  return React.useMemo(() => getBooksObservable(container), [container]);
}
