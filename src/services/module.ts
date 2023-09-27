import { composeModules } from "microinject";

import historyModule from "./history/module";
import schedulerModule from "./scheduler/module";
import csCompendiumModule from "./sh-compendium/module";
import csMonitorModule from "./sh-game/module";
import csApiModule from "./sh-api/module";
import pinsModule from "./sh-pins/module";

export default composeModules(
  historyModule,
  schedulerModule,
  csCompendiumModule,
  csMonitorModule,
  csApiModule,
  pinsModule
);
