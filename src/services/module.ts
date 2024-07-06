import { composeModules } from "microinject";

import dialogModule from "./dialog/module";
import historyModule from "./history/module";
import pageModule from "./page/module";
import pinsModule from "./pins/module";
import schedulerModule from "./scheduler/module";
import searchModule from "./search/module";
import shCompendiumModule from "./sh-compendium/module";
import shMonitorModule from "./sh-game/module";
import shApiModule from "./sh-api/module";
import updatePollerModule from "./update-poller/module";

export default composeModules(
  dialogModule,
  historyModule,
  pageModule,
  pinsModule,
  schedulerModule,
  searchModule,
  shCompendiumModule,
  shMonitorModule,
  shApiModule,
  updatePollerModule
);
