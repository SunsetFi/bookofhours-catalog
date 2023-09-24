import { ContainerModule } from "microinject";

import { Orchestrator } from "./orchestration/Orchestrator";
import { CharacterSourceImpl } from "./sources/CharacterSourceImpl";
import { CraftingSourceImpl } from "./sources/CraftingSourceImpl";
import { RunningSourceImpl } from "./sources/RunningSourceImpl";
import { TimeSourceImpl } from "./sources/TimeSourceImpl";
import { TokensSourceImpl } from "./sources/TokensSourceImpl";

import { TokenModelFactory } from "./token-models/TokenModelFactory";
import { TokenVisibilityFactory } from "./token-models/TokenVisibilityFactory";
import { TokenParentTerrainFactory } from "./token-models/TokenParentTerrainFactory";

import { GameModel } from "./GameModel";

export default new ContainerModule((bind) => {
  bind(Orchestrator);
  bind(CharacterSourceImpl);
  bind(CraftingSourceImpl);
  bind(RunningSourceImpl);
  bind(TokensSourceImpl);
  bind(TimeSourceImpl);
  bind(TokenModelFactory);
  bind(TokenVisibilityFactory);
  bind(TokenParentTerrainFactory);
  bind(GameModel);
});
