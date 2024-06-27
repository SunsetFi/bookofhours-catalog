import { ContainerModule } from "microinject";
import { DialogService } from "./DialogService";

export default new ContainerModule((bind) => {
  bind(DialogService);
});
