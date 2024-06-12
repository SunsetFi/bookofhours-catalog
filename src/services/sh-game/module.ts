import { ContainerModule } from "microinject";

import { Orchestrator } from "./orchestration/Orchestrator";
import { OrchestrationFactory } from "./orchestration/OrchestrationFactory";

import { CharacterSource } from "./sources/CharacterSource";
import { RunningSource } from "./sources/RunningSource";
import { TimeSource } from "./sources/TimeSource";
import { TokensSource } from "./sources/TokensSource";

import { TokenModelFactory } from "./token-models/TokenModelFactory";
import { TokenVisibilityFactory } from "./token-models/TokenVisibilityFactory";
import { TokenParentTerrainFactory } from "./token-models/TokenParentTerrainFactory";

import { TerrainUnlocker } from "./TerrainUnlocker";

export default new ContainerModule((bind) => {
  bind(Orchestrator);
  bind(OrchestrationFactory);
  bind(CharacterSource);
  bind(RunningSource);
  bind(TokensSource);
  bind(TimeSource);
  bind(TokenModelFactory);
  bind(TokenVisibilityFactory);
  bind(TokenParentTerrainFactory);
  bind(TerrainUnlocker);
});
