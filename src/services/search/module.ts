import { ContainerModule } from "microinject";

import { SearchService } from "./SearchService";

export default new ContainerModule((bind) => {
  bind(SearchService);
});
