import { composeModules } from "microinject";

import csCompendiumModule from "./sh-compendium/module";
import csMonitorModule from "./sh-monitor/module";
import csApiModule from "./sh-api/module";
import historyModule from "./history/module";

export default composeModules(
  csCompendiumModule,
  csMonitorModule,
  csApiModule,
  historyModule
);
