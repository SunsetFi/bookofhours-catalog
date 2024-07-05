import React from "react";

import type { Instance as PopperInstance } from "@popperjs/core";

import { Box, Popper, SxProps } from "@mui/material";

import { useMutationObserver } from "@/hooks/use-mutation-observer";
import { useDebounceCommitValue } from "@/hooks/use-debounce-value";

export interface TooltipProps {
  sx?: SxProps;
  children: React.ReactNode;
  title: React.ReactNode;
  disabled?: boolean;
}

/**
 * This is a much-improved version of the MUI tooltip class.
 * It provides:
 * - ARIA support
 * - Auto open on delay (again, for ARIA support)
 * - Automatic resizing and repositioning for popped content changes.
 */
const Tooltip = ({ sx, children, title, disabled }: TooltipProps) => {
  const id = React.useId();

  const popperRef = React.useRef<PopperInstance>(null);
  const [anchorRef, setAnchorRef] = React.useState<HTMLDivElement | null>(null);
  const [contentRef, setContentRef] = React.useState<HTMLDivElement | null>(
    null
  );

  const [mouseOver, setMouseOver] = React.useState(false);
  const [delayedFocus, setDelayedFocus] = React.useState(false);

  const onMouseOver = React.useCallback((e: React.MouseEvent<HTMLElement>) => {
    setMouseOver(true);
  }, []);

  const onMouseOut = React.useCallback(() => {
    setDelayedFocus(false);
    setMouseOver(false);
  }, []);

  const onKeyPress = React.useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setMouseOver(false);
      setDelayedFocus(false);
    }
  }, []);

  const [immediateFocus, focusChange] = useDebounceCommitValue<boolean>(
    500,
    setDelayedFocus
  );

  useMutationObserver(contentRef, () => {
    if (popperRef.current == null) {
      return;
    }

    popperRef.current.update();
  });

  const open =
    !disabled && (mouseOver || (immediateFocus && delayedFocus) || false);

  return (
    <>
      <Box
        sx={sx}
        component="span"
        id={id}
        aria-describedby={open ? `${id}-tooltip` : undefined}
        ref={setAnchorRef}
        tabIndex={0}
        onMouseOver={onMouseOver}
        onMouseOut={onMouseOut}
        onFocus={() => focusChange(true)}
        onBlur={() => focusChange(false)}
        onKeyDown={onKeyPress}
      >
        {children}
      </Box>
      <Popper
        popperRef={popperRef}
        open={open}
        anchorEl={anchorRef}
        modifiers={[
          {
            name: "preventOverflow",
            options: {
              mainAxis: true,
              altAxis: true,
              boundariesElement: "viewport",
              padding: 8,
            },
          },
        ]}
        sx={{
          pointerEvents: "none",
          // Frustratingly, we need this for tooltips nested in other popovers.
          // We wouldnt need this except that MUI puts its own grossly high z index on its popups, so we need to scream louder than it.
          zIndex: 2000,
        }}
      >
        <Box id={`${id}-tooltip`} ref={setContentRef}>
          {title}
        </Box>
      </Popper>
    </>
  );
};

export default Tooltip;
