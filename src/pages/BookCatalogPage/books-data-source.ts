import React from "react";
import { Container } from "microinject";

import { pick, first } from "lodash";
import {
  Observable,
  combineLatest,
  distinctUntilChanged,
  map,
  switchMap,
} from "rxjs";
import { Aspects } from "secrethistories-api";

import { useDIContainer } from "@/container";
import { powerAspects } from "@/aspects";
import { decorateObjectInstance } from "@/object-decorator";

import {
  Null$,
  distinctUntilShallowArrayChanged,
  mapArrayItemsCached,
  switchMapIfNotNull,
} from "@/observables";

import { Compendium, ElementModel } from "@/services/sh-compendium";

import {
  ElementStackModel,
  Orchestrator,
  TokensSource,
  filterHasAnyAspect,
  filterHasNoneOfAspect,
  filterTokenNotInPath,
} from "@/services/sh-game";

export interface BookModelDecorations {
  id: string;
  memory$: Observable<ElementModel | null>;
  memoryElementId$: Observable<string | null>;
  memoryLabel$: Observable<string | null>;
  memoryAspects$: Observable<Aspects>;
  read(): void;
}

export type BookModel = ElementStackModel & BookModelDecorations;

const xextIntroMatch = /^reading\.([^\.]+)\.intro$/;
const xextFinalMatch = /^reading\.([^\.]+)$/;

function elementStackToBook(
  elementStack: ElementStackModel,
  compendium: Compendium,
  orchestrator: Orchestrator,
): BookModel {
  const isMastered$ = elementStack.aspects$.pipe(
    map((aspects) => {
      const mastery = Object.keys(aspects).find((aspectId) =>
        aspectId.startsWith("mastery."),
      );
      if (!mastery || aspects[mastery] < 1) {
        return false;
      }

      return true;
    }),
  );

  const memory$ = combineLatest([isMastered$, elementStack.element$]).pipe(
    switchMap(([isMastered, element]) => {
      if (!isMastered) {
        return Null$;
      }

      return element.xtriggers$.pipe(
        map((xtriggers) => {
          const readingTrigger = Object.keys(xtriggers).find((x) =>
            x.startsWith("reading."),
          );

          if (readingTrigger) {
            return first(xtriggers[readingTrigger])?.id ?? null;
          }

          return null;
        }),
      );
    }),
    distinctUntilChanged(),
    map((memoryId) => (memoryId ? compendium.getElementById(memoryId) : null)),
  );

  const memoryElementId$ = memory$.pipe(
    map((memory) => memory?.elementId ?? null),
  );
  const memoryLabel$ = memory$.pipe(
    switchMapIfNotNull((memory) => memory.label$),
  );

  const memoryAspects$ = memory$.pipe(
    switchMapIfNotNull((memory) => memory?.aspects$),
    map((aspects) => pick(aspects ?? {}, powerAspects)),
  );

  const elementXexts$ = elementStack.element$.pipe(
    switchMapIfNotNull((element) => element.xexts$),
  );
  const description$ = combineLatest([
    elementStack.description$,
    isMastered$,
    elementXexts$,
  ]).pipe(
    map(([description, isMastered, xexts]) => {
      let result = description;

      if (isMastered && xexts) {
        const firstKey = Object.keys(xexts).find((x) => xextIntroMatch.test(x));
        if (firstKey) {
          result = result + "\n\n" + xexts[firstKey];
        }

        const finalKey = Object.keys(xexts).find((x) => xextFinalMatch.test(x));
        if (finalKey) {
          result = result + "\n\n" + xexts[finalKey];
        }
      }

      return result;
    }),
  );

  return decorateObjectInstance(elementStack, {
    get id() {
      return elementStack.id;
    },
    memory$,
    memoryElementId$,
    memoryLabel$,
    memoryAspects$,
    description$,
    // Journal has a lot of complex unique recipes that we are not dealing with currently.
    read() {
      if (elementStack.elementId.startsWith("uncatbook.")) {
        const period = elementStack.elementId.substring(10);
        orchestrator.openOrchestration({
          recipeId: `catalogue.book.${period}`,
          desiredElementIds: [elementStack.elementId],
        });
      } else {
        const mystery = extractMysteryAspect(elementStack.aspects);
        if (mystery == null) {
          return;
        }

        const isMastered = Object.keys(elementStack.aspects).some((aspectId) =>
          aspectId.startsWith("mastery."),
        );

        const recipeId = isMastered
          ? `study.mystery.${mystery}.mastered`
          : `study.mystery.${mystery}.mastering.begin`;
        orchestrator.openOrchestration({
          recipeId,
          desiredElementIds: [elementStack.elementId],
        });
      }
    },
  });
}

function extractMysteryAspect(aspects: Aspects): string | null {
  let mystery = Object.keys(aspects).find((aspectId) =>
    aspectId.startsWith("mystery."),
  );
  if (!mystery) {
    return null;
  }

  return mystery.substring(8);
}

export function getBooksObservable(
  container: Container,
): Observable<BookModel[]> {
  const compendium = container.get(Compendium);
  const orchestrator = container.get(Orchestrator);
  const tokensSource = container.get(TokensSource);

  return tokensSource.visibleElementStacks$.pipe(
    filterHasAnyAspect("readable"),
    filterHasNoneOfAspect(["journal", "correspondence"]),
    // Ignore tokens in arrival verbs.
    // These can be books oriflame is selling us.
    filterTokenNotInPath("~/arrivalverbs"),
    distinctUntilShallowArrayChanged(),
    mapArrayItemsCached((item) =>
      elementStackToBook(item, compendium, orchestrator),
    ),
  );
}

export function useBooks() {
  const container = useDIContainer();
  return React.useMemo(() => {
    return getBooksObservable(container);
  }, [container]);
}
