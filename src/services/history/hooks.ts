import { useDIDependency } from "@/container";

import { History } from "./History";

export function useHistory() {
  return useDIDependency(History);
}
