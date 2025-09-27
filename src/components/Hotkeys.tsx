import React from "react";

import { useDIDependency } from "@/container";

import { useNativeEvent } from "@/hooks/native-event";

import { SearchService } from "@/services/search";
import { Orchestrator } from "@/services/sh-game";

export interface HotkeysProps {
  children: React.ReactNode;
}
const Hotkeys = ({ children }: HotkeysProps) => {
  const searchService = useDIDependency(SearchService);
  const orchestrator = useDIDependency(Orchestrator);

  const onKeyDown = React.useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "k" && e.ctrlKey) {
        e.preventDefault();
        e.stopPropagation();
        searchService.open();
      }
      if (e.key === "o" && e.ctrlKey) {
        e.preventDefault();
        e.stopPropagation();
        if (orchestrator.orchestration) {
          orchestrator.closeOrchestration();
        } else {
          orchestrator.toggleDrawer();
        }
      }
    },
    [searchService, orchestrator],
  );

  useNativeEvent(document, "keydown", onKeyDown);

  return <>{children}</>;
};

export default Hotkeys;
