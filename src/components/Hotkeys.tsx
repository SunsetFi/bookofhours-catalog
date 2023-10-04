import * as React from "react";

import { useDIDependency } from "@/container";

import { useNativeEvent } from "@/hooks/native-event";

import { SearchService } from "@/services/search";

export interface HotkeysProps {
  children: React.ReactNode;
}
const Hotkeys = ({ children }: HotkeysProps) => {
  const searchService = useDIDependency(SearchService);

  const onKeyDown = React.useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "k" && e.ctrlKey) {
        e.preventDefault();
        e.stopPropagation();
        searchService.open();
      }
    },
    [searchService]
  );

  useNativeEvent(document, "keydown", onKeyDown);

  return <>{children}</>;
};

export default Hotkeys;
