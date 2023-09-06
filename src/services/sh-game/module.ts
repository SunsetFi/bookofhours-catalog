import { ContainerModule } from "microinject";

import { RunningSourceImpl } from "./sources/RunningSourceImpl";
import { CharacterSourceImpl } from "./sources/CharacterSourceImpl";
import { TokensSourceImpl } from "./sources/TokensSourceImpl";

import { TokenModelFactory } from "./token-models/TokenModelFactory";
import { TokenVisibilityFactory } from "./token-models/TokenVisibilityFactory";
import { TokenParentTerrainFactory } from "./token-models/TokenParentTerrainFactory";

import { GameModel } from "./GameModel";

export default new ContainerModule((bind) => {
  bind(RunningSourceImpl);
  bind(CharacterSourceImpl);
  bind(TokensSourceImpl);
  bind(TokenModelFactory);
  bind(TokenVisibilityFactory);
  bind(TokenParentTerrainFactory);
  bind(GameModel);
});
