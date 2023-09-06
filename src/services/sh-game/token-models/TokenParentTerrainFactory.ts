import {
  Observable,
  combineLatest,
  distinctUntilChanged,
  map,
  shareReplay,
} from "rxjs";
import { Token } from "secrethistories-api";
import { inject, injectable, singleton } from "microinject";

import {
  distinctUntilShallowArrayChanged,
  filterItems,
  mapArrayItemsCached,
  observeAll,
} from "@/observables";

import { TokensSource } from "../sources";

import {
  ConnectedTerrainModel,
  isConnectedTerrainModel,
} from "./ConnectedTerrainModel";

@injectable()
@singleton()
export class TokenParentTerrainFactory {
  private readonly _terrainsByPath$: Observable<
    Record<string, ConnectedTerrainModel>
  >;
  constructor(@inject(TokensSource) tokensSource: TokensSource) {
    this._terrainsByPath$ = tokensSource.tokens$.pipe(
      filterItems(isConnectedTerrainModel),
      distinctUntilShallowArrayChanged(),
      mapArrayItemsCached((t) =>
        t.path$.pipe(map((path) => [path, t] as const))
      ),
      observeAll(),
      map((items) => Object.fromEntries(items))
    );
  }

  createParentTerrainObservable(
    token$: Observable<Token>
  ): Observable<ConnectedTerrainModel | null> {
    return combineLatest([token$, this._terrainsByPath$]).pipe(
      map(([token, terrainsByPath]) => {
        for (const path of Object.keys(terrainsByPath)) {
          if (token.path.startsWith(path)) {
            return terrainsByPath[path];
          }
        }

        return null;
      }),
      distinctUntilChanged(),
      shareReplay(1)
    );
  }
}
