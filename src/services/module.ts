import { composeModules } from "microinject";

import dialogModule from "./dialog/module";
import githubUpdatesModule from "./github-updates/module";
import historyModule from "./history/module";
import pageModule from "./page/module";
import pinsModule from "./pins/module";
import schedulerModule from "./scheduler/module";
import searchModule from "./search/module";
import settingsModule from "./settings/module";
import shCompendiumModule from "./sh-compendium/module";
import shMonitorModule from "./sh-game/module";
import shApiModule from "./sh-api/module";
import updatePollerModule from "./update-poller/module";

export default composeModules(
  dialogModule,
  githubUpdatesModule,
  historyModule,
  pageModule,
  pinsModule,
  schedulerModule,
  searchModule,
  settingsModule,
  shCompendiumModule,
  shMonitorModule,
  shApiModule,
  updatePollerModule,
);
