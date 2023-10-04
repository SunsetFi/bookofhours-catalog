import * as React from "react";

import { useDIDependency } from "@/container";
import { SearchService } from "@/services/search";
import { useNativeEvent } from "@/hooks/native-event";

export interface HotkeysProps {
  children: React.ReactNode;
}
const Hotkeys = ({ children }: HotkeysProps) => {
  const docRef = React.useRef(document);
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

  const onBoxMount = React.useCallback((ref: HTMLDivElement | null) => {
    if (ref) {
      ref.focus();
    }
  }, []);

  useNativeEvent(docRef, "keydown", onKeyDown);

  return <>{children}</>;
};

export default Hotkeys;
