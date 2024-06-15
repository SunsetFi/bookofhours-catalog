import {
  Observable,
  combineLatest,
  distinctUntilChanged,
  map,
  shareReplay,
} from "rxjs";
import { Token } from "secrethistories-api";
import { Container, inject, injectable, singleton } from "microinject";

import {
  distinctUntilShallowArrayChanged,
  filterItems,
  observeAllMap,
} from "@/observables";

import { TokensSource } from "../sources/TokensSource";

import {
  ConnectedTerrainModel,
  isConnectedTerrainModel,
} from "./ConnectedTerrainModel";
import { tokenPathContainsChild } from "@/utils";

@injectable()
@singleton()
export class TokenParentTerrainFactory {
  // We have a circular dependency here due to needing tokens from tokenSource, but tokenSource indirectly needing us to make the models.
  // Since we cannot inject TokensSource, just grab the container and get it later.
  constructor(@inject(Container) private readonly _container: Container) {}

  private __terrainsByPath$: Observable<
    Record<string, ConnectedTerrainModel>
  > | null = null;
  private get _terrainsByPath$() {
    if (this.__terrainsByPath$ === null) {
      this.__terrainsByPath$ = this._container.get(TokensSource).tokens$.pipe(
        filterItems(isConnectedTerrainModel),
        distinctUntilShallowArrayChanged(),
        observeAllMap((t) => t.path$.pipe(map((path) => [path, t] as const))),
        map((items) => Object.fromEntries(items)),
        shareReplay(1)
      );
    }

    return this.__terrainsByPath$;
  }

  createParentTerrainObservable(
    token$: Observable<Token>
  ): Observable<ConnectedTerrainModel | null> {
    return combineLatest([token$, this._terrainsByPath$]).pipe(
      map(([token, terrainsByPath]) => {
        for (const path of Object.keys(terrainsByPath)) {
          if (tokenPathContainsChild(path, token.path)) {
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
