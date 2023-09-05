import { inject, injectable, provides, singleton } from "microinject";
import { Observable, map, shareReplay } from "rxjs";

import {
  distinctUntilShallowArrayChanged,
  filterItemObservations,
} from "@/observables";

import {
  ConnectedTerrainModel,
  isConnectedTerrainModel,
} from "../token-models/ConnectedTerrainModel";

import { TokensSource, TerrainsSource } from "./services";

@injectable()
@singleton()
@provides(TerrainsSource)
export class TerrainsSourceImpl implements TerrainsSource {
  private readonly _unlockedTerrains$: Observable<
    readonly ConnectedTerrainModel[]
  >;

  constructor(@inject(TokensSource) tokensSource: TokensSource) {
    this._unlockedTerrains$ = tokensSource.tokens$.pipe(
      map((tokens) => tokens.filter(isConnectedTerrainModel)),
      filterItemObservations((item) => item.shrouded$.pipe(map((x) => !x))),
      distinctUntilShallowArrayChanged(),
      shareReplay(1)
    );
  }

  get unlockedTerrains$() {
    return this._unlockedTerrains$;
  }
}
