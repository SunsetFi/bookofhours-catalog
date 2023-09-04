import { ContainerModule } from "microinject";
import { Scheduler } from "./Scheduler";

export default new ContainerModule((bind) => {
  bind(Scheduler);
});
