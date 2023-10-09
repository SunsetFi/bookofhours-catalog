import { Container, inject, injectable, singleton } from "microinject";
import { Situation, Token } from "secrethistories-api";

import { API } from "@/services/sh-api";
import { Compendium } from "@/services/sh-compendium";

import { TokenModel } from "./TokenModel";
import { ElementStackModel } from "./ElementStackModel";
import { ConnectedTerrainModel } from "./ConnectedTerrainModel";
import { SituationModel } from "./SituationModel";
import { TokenVisibilityFactory } from "./TokenVisibilityFactory";
import { TokenParentTerrainFactory } from "./TokenParentTerrainFactory";

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
          this._container.get(TokenParentTerrainFactory)
        );
      case "ConnectedTerrain":
        return new ConnectedTerrainModel(
          token,
          this._container.get(API),
          this._container.get(Compendium).getRecipeById(token.infoRecipeId)
        );
      case "Situation":
      case "WorkstationSituation" as any:
        return new SituationModel(
          token as Situation,
          this._container.get(API),
          this._container.get(TokenVisibilityFactory),
          this._container.get(TokenParentTerrainFactory)
        );
      default:
        throw new Error(`Unknown token type: ${(token as any).payloadType}`);
    }
  }
}
