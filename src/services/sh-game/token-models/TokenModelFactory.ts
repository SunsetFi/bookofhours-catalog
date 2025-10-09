import { Container, inject, injectable, singleton } from "microinject";
import { Situation, Token } from "secrethistories-api";

import { API } from "@/services/sh-api";
import { Compendium } from "@/services/sh-compendium";
import { BatchingScheduler } from "@/services/scheduler";

import { TokensSource } from "../sources/TokensSource";

import { TokenModel } from "./TokenModel";
import { ElementStackModel } from "./ElementStackModel";
import { ConnectedTerrainModel } from "./ConnectedTerrainModel";
import { SituationModel } from "./SituationModel";
import { TokenParentTerrainFactory } from "./TokenParentTerrainFactory";
import { WisdomNodeTerrainModel } from "./WisdomNodeTerrainModel";

@injectable()
@singleton()
export class TokenModelFactory {
  constructor(
    @inject(API) private readonly _api: API,
    @inject(Compendium) private readonly _compendium: Compendium,
    @inject(TokensSource) private readonly _tokensSource: TokensSource,
    @inject(BatchingScheduler)
    private readonly _batchingScheduler: BatchingScheduler,
    @inject(TokenParentTerrainFactory)
    private readonly _tokenParentTerrainFactory: TokenParentTerrainFactory,
  ) {}

  create(token: Token): TokenModel {
    switch (token.payloadType) {
      case "ElementStack":
        return new ElementStackModel(
          token,
          this._api,
          this._compendium,
          this._tokenParentTerrainFactory,
          this._batchingScheduler,
        );
      case "ConnectedTerrain":
        return new ConnectedTerrainModel(
          token,
          this._api,
          this._compendium.getRecipeById(token.infoRecipeId),
          this._tokensSource.visibleTokens$,
        );
      case "WisdomNodeTerrain":
        return new WisdomNodeTerrainModel(
          token,
          this._api,
          this._tokensSource.tokens$,
          this._compendium,
          this._batchingScheduler,
        );
      case "Situation":
      case "WorkstationSituation":
      case "RoomWorkSituation":
      case "SalonSituation":
        return new SituationModel(
          token as Situation,
          this._api,
          this._tokensSource.visibleElementStacks$,
          this._tokenParentTerrainFactory,
          this._batchingScheduler,
        );
      default:
        throw new Error(`Unknown token type: ${(token as any).payloadType}`);
    }
  }
}
