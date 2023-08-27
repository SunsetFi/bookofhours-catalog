import { ContainerModule } from "microinject";

import { Compendium } from "./Compendium";

export default new ContainerModule((bind) => {
  bind(Compendium);
});
