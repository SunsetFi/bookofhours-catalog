import { ContainerModule } from "microinject";
import { GameModel } from "./GameModel";

export default new ContainerModule((bind) => {
  bind(GameModel);
});
