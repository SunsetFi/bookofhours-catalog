import { ContainerModule } from "microinject";

import { RunningSourceImpl } from "./sources/RunningSourceImpl";
import { CharacterSourceImpl } from "./sources/CharacterSourceImpl";
import { TerrainsSourceImpl } from "./sources/TerrainsSourceImpl";
import { TokensSourceImpl } from "./sources/TokensSourceImpl";

import { TokenModelFactory } from "./token-models/TokenModelFactory";

import { GameModel } from "./GameModel";

export default new ContainerModule((bind) => {
  bind(RunningSourceImpl);
  bind(CharacterSourceImpl);
  bind(TerrainsSourceImpl);
  bind(TokensSourceImpl);
  bind(TokenModelFactory);
  bind(GameModel);
});
