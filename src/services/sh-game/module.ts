import { ContainerModule } from "microinject";

import { CharacterSourceImpl } from "./sources/CharacterSourceImpl";
import { CraftablesSourceImpl } from "./sources/CraftablesSourceImpl";
import { RunningSourceImpl } from "./sources/RunningSourceImpl";
import { TokensSourceImpl } from "./sources/TokensSourceImpl";

import { TokenModelFactory } from "./token-models/TokenModelFactory";
import { TokenVisibilityFactory } from "./token-models/TokenVisibilityFactory";
import { TokenParentTerrainFactory } from "./token-models/TokenParentTerrainFactory";

import { GameModel } from "./GameModel";

export default new ContainerModule((bind) => {
  bind(CharacterSourceImpl);
  bind(CraftablesSourceImpl);
  bind(RunningSourceImpl);
  bind(TokensSourceImpl);
  bind(TokenModelFactory);
  bind(TokenVisibilityFactory);
  bind(TokenParentTerrainFactory);
  bind(GameModel);
});
