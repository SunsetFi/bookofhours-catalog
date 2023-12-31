import { Container, inject, injectable, singleton } from "microinject";
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
  mapArrayItems,
  observeAll,
} from "@/observables";

import { TokensSource } from "../sources/TokensSource";

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
  // We have a circular dependency here due to needing tokens from tokenSource, but tokenSource indirectly needing us to make the models.
  // Since we cannot inject TokensSource, just grab the container and get it later.
  constructor(@inject(Container) private readonly _container: Container) {}

  private __visiblePaths$: Observable<readonly string[]> | null = null;
  private get _visiblePaths$() {
    if (!this.__visiblePaths$) {
      this.__visiblePaths$ = this._container.get(TokensSource).tokens$.pipe(
        filterItems(isConnectedTerrainModel),
        distinctUntilShallowArrayChanged(),
        filterItemObservations((t) =>
          combineLatest([t.shrouded$, t.sealed$]).pipe(
            map(([shrouded, sealed]) => !shrouded && !sealed)
          )
        ),
        mapArrayItems((t) => t.path$),
        observeAll(),
        shareReplay(1)
      );
    }

    return this.__visiblePaths$;
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
