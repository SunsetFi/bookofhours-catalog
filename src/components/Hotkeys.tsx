import * as React from "react";

import Box from "@mui/material/Box";
import { useDIDependency } from "@/container";
import { SearchService } from "@/services/search";

export interface HotkeysProps {
  children: React.ReactNode;
}
const Hotkeys = ({ children }: HotkeysProps) => {
  const searchService = useDIDependency(SearchService);
  const onKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
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

  return (
    <Box
      ref={onBoxMount}
      tabIndex={-1}
      autoFocus
      sx={{ width: "100%", height: "100%" }}
      onKeyDown={onKeyDown}
    >
      {children}
    </Box>
  );
};

export default Hotkeys;
