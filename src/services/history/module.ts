import { ContainerModule } from "microinject";
import { History, historyFactory } from "./History";

export default new ContainerModule((bind) => {
  bind(History).toFactory(historyFactory).inSingletonScope();
});
