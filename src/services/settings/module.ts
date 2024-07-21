import { ContainerModule } from "microinject";

import { SettingsManager } from "./SettingsManager";

export default new ContainerModule((bind) => {
  bind(SettingsManager);
});
