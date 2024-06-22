import { ContainerModule } from "microinject";
import { UpdatePoller } from "./UpdatePoller";

export default new ContainerModule((bind) => {
  bind(UpdatePoller);
});
