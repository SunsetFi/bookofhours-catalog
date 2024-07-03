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
import { TokenVisibilityFactory } from "./TokenVisibilityFactory";
import { TokenParentTerrainFactory } from "./TokenParentTerrainFactory";
import { WisdomNodeTerrainModel } from "./WisdomNodeTerrainModel";

@injectable()
@singleton()
export class TokenModelFactory {
  constructor(@inject(Container) private readonly _container: Container) {}

  create(token: Token): TokenModel {
    switch (token.payloadType) {
      case "ElementStack":
        return new ElementStackModel(
          token,
          this._container.get(API),
          this._container.get(Compendium),
          this._container.get(TokenVisibilityFactory),
          this._container.get(TokenParentTerrainFactory),
          this._container.get(BatchingScheduler)
        );
      case "ConnectedTerrain":
        return new ConnectedTerrainModel(
          token,
          this._container.get(API),
          this._container.get(Compendium).getRecipeById(token.infoRecipeId),
          this._container.get(TokensSource).visibleTokens$
        );
      case "WisdomNodeTerrain":
        return new WisdomNodeTerrainModel(
          token,
          this._container.get(API),
          this._container.get(TokensSource).tokens$,
          this._container.get(Compendium)
        );
      case "Situation":
      case "WorkstationSituation" as any:
      case "RoomWorkSituation" as any:
        return new SituationModel(
          token as Situation,
          this._container.get(API),
          this._container.get(TokensSource).visibleElementStacks$,
          this._container.get(TokenVisibilityFactory),
          this._container.get(TokenParentTerrainFactory),
          this._container.get(BatchingScheduler)
        );
      default:
        throw new Error(`Unknown token type: ${(token as any).payloadType}`);
    }
  }
}
