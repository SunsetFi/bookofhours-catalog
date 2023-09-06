import { inject, injectable, singleton } from "microinject";
import {
  Observable,
  combineLatest,
  distinctUntilChanged,
  map,
  shareReplay,
} from "rxjs";
import { Token } from "secrethistories-api";

import {
  distinctUntilShallowArrayChanged,
  filterItemObservations,
  filterItems,
  mapItems,
  observeAll,
} from "@/observables";

import { TokensSource } from "../sources";

import { isConnectedTerrainModel } from "./ConnectedTerrainModel";

const playerSpherePaths = [
  "~/portage1",
  "~/portage2",
  "~/portage3",
  "~/portage4",
  "~/portage5",
  "~/hand.abilities",
  "~/hand.skills",
  "~/hand.memories",
  "~/hand.misc",
];

@injectable()
@singleton()
export class TokenVisibilityFactory {
  private readonly _visiblePaths$: Observable<readonly string[]>;
  constructor(@inject(TokensSource) tokensSource: TokensSource) {
    this._visiblePaths$ = tokensSource.tokens$.pipe(
      filterItems(isConnectedTerrainModel),
      distinctUntilShallowArrayChanged(),
      filterItemObservations((t) => t.visible$),
      mapItems((t) => t.path$),
      observeAll()
    );
  }

  createVisibilityObservable(token$: Observable<Token>): Observable<boolean> {
    return combineLatest([token$, this._visiblePaths$]).pipe(
      map(([token, visiblePaths]) => {
        if (playerSpherePaths.some((p) => token.path.startsWith(p))) {
          return true;
        }

        if (visiblePaths.some((path) => token.path.startsWith(path))) {
          return true;
        }

        return false;
      }),
      distinctUntilChanged(),
      shareReplay(1)
    );
  }
}
