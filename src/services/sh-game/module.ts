import { ContainerModule } from "microinject";

import { Orchestrator } from "./orchestration/Orchestrator";
import { OrchestrationFactory } from "./orchestration/OrchestrationFactory";

import { CharacterSource } from "./sources/CharacterSource";
import { GameStateSource } from "./sources/GameStateSource";
import { TimeSource } from "./sources/TimeSource";
import { TokensSource } from "./sources/TokensSource";

import { TokenModelFactory } from "./token-models/TokenModelFactory";
import { TokenVisibilityFactory } from "./token-models/TokenVisibilityFactory";
import { TokenParentTerrainFactory } from "./token-models/TokenParentTerrainFactory";

import { TerrainUnlocker } from "./TerrainUnlocker";
import { SaveManager } from "./SaveManager/SaveManager";

export default new ContainerModule((bind) => {
  bind(Orchestrator);
  bind(OrchestrationFactory);
  bind(CharacterSource);
  bind(GameStateSource);
  bind(TokensSource);
  bind(TimeSource);
  bind(TokenModelFactory);
  bind(TokenVisibilityFactory);
  bind(TokenParentTerrainFactory);
  bind(TerrainUnlocker);
  bind(SaveManager);
});
