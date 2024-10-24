import { ContainerModule } from "microinject";
import { GithubUpdateService } from "./GithubUpdateService";

export default new ContainerModule((bind) => {
  bind(GithubUpdateService);
});
