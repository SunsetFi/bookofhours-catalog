import { ContainerModule } from "microinject";
import { Pinboard } from "./Pinboard";

export default new ContainerModule((bind) => {
  bind(Pinboard);
});
