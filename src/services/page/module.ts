import { ContainerModule } from "microinject";
import { PageManager } from "./PageManager";

export default new ContainerModule((bind) => {
  bind(PageManager);
});
