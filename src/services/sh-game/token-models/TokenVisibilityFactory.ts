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
  observeAllMap,
} from "@/observables";

import { tokenPathContainsChild } from "@/utils";

import { alwaysVisibleSpherePaths } from "@/spheres";

import { TokensSource } from "../sources/TokensSource";

import { isConnectedTerrainModel } from "./ConnectedTerrainModel";

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
            // We can still see inside WisdomNodeTerrains that are shrouded.
            map(
              ([shrouded, sealed]) =>
                (!shrouded || t.payloadType === "WisdomNodeTerrain") && !sealed
            )
          )
        ),
        observeAllMap((t) => t.path$),
        shareReplay(1)
      );
    }

    return this.__visiblePaths$;
  }

  createVisibilityObservable(token$: Observable<Token>): Observable<boolean> {
    return combineLatest([token$, this._visiblePaths$]).pipe(
      map(([token, visiblePaths]) => {
        if (
          alwaysVisibleSpherePaths.some((path) =>
            tokenPathContainsChild(path, token.path)
          )
        ) {
          return true;
        }

        // FIXME: We might be in a shrouded sub-sphere.  Need to check that
        // HACK: For now, the only case this shows up is christmas stuff
        if (token.path.startsWith("~/library!brancrug/christmasslot.")) {
          return false;
        }

        if (
          visiblePaths.some((path) => tokenPathContainsChild(path, token.path))
        ) {
          return true;
        }

        return false;
      }),
      distinctUntilChanged(),
      shareReplay(1)
    );
  }
}
