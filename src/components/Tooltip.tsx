import React from "react";

import type { Instance as PopperInstance } from "@popperjs/core";

import { Box, Popper, SxProps } from "@mui/material";

import { useMutationObserver } from "@/hooks/use-mutation-observer";

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
    null,
  );

  const [mouseFocusing, setMouseFocusing] = React.useState(false);
  const mouseFocusingTimeoutRef = React.useRef<number | null>(null);

  const focusOff = React.useCallback(() => {
    setMouseFocusing(false);
    if (mouseFocusingTimeoutRef.current != null) {
      clearTimeout(mouseFocusingTimeoutRef.current);
      mouseFocusingTimeoutRef.current = null;
    }
  }, []);

  const focusStart = React.useCallback(() => {
    if (disabled) {
      return;
    }

    if (mouseFocusingTimeoutRef.current != null) {
      clearTimeout(mouseFocusingTimeoutRef.current);
      mouseFocusingTimeoutRef.current = null;
    }

    mouseFocusingTimeoutRef.current = setTimeout(() => {
      setMouseFocusing(true);
    }, 400);
  }, [disabled]);

  React.useEffect(() => {
    if (disabled) {
      if (mouseFocusingTimeoutRef.current != null) {
        clearTimeout(mouseFocusingTimeoutRef.current);
        mouseFocusingTimeoutRef.current = null;
      }
      setMouseFocusing(false);
    }
  }, [disabled]);

  const open = !disabled && mouseFocusing;

  useMutationObserver(contentRef, () => {
    if (popperRef.current == null) {
      return;
    }

    popperRef.current.update();
  });

  const onKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (!open) {
        // We might be nested in other poppers, so if we are not open, let the parent handle it.
        return;
      }

      if (e.key === "Escape") {
        // We might be nested in other poppers, so stop propagation here.
        e.preventDefault();
        e.stopPropagation();
        focusOff();
      }
    },
    [open, focusOff],
  );

  return (
    <>
      <Box
        sx={{ lineHeight: 0, ...sx }}
        component="span"
        role="none"
        id={id}
        aria-describedby={open ? `${id}-tooltip` : undefined}
        ref={setAnchorRef}
        onFocus={focusStart}
        onBlur={focusOff}
        onMouseOver={focusStart}
        // Reset the timer if the mouse moves.
        onMouseMove={focusStart}
        onMouseOut={focusOff}
        onKeyDown={onKeyDown}
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
        {open && (
          <Box id={`${id}-tooltip`} ref={setContentRef}>
            {title}
          </Box>
        )}
      </Popper>
    </>
  );
};

export default Tooltip;
