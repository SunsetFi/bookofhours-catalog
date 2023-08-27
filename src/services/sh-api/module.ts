import { ContainerModule } from "microinject";

import { API, APIFactory } from "./index";

export default new ContainerModule((bind) => {
  bind(API).toFactory(APIFactory).inSingletonScope();
});
