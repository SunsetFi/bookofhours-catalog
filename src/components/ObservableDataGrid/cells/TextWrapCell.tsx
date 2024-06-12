import React from "react";

import { Box, Tooltip } from "@mui/material";

import { CellContext, RowData } from "@tanstack/react-table";

import { useComponentBounds } from "@/hooks/use-component-bounds";

import GameTypography from "../../GameTypography";

import { RowHeight, RowPaddingY } from "../constants";

function TextWrapCell<T extends RowData>(props: CellContext<T, string | null>) {
  const [containerRef, setContainerRef] = React.useState<HTMLDivElement | null>(
    null
  );
  const [textRef, setTextRef] = React.useState<HTMLSpanElement | null>(null);

  const { height: containerHeight } = useComponentBounds(containerRef);
  const { height: textHeight } = useComponentBounds(textRef);

  const [open, setOpen] = React.useState(false);

  const textTooBig = textHeight > containerHeight;

  const onMouseOver = React.useCallback(() => {
    if (!textTooBig) {
      return;
    }

    setOpen(true);
  }, [textTooBig]);

  const value = props.getValue();
  if (!value) {
    return null;
  }

  return (
    <Box
      ref={setContainerRef}
      sx={{
        position: "relative",
        height: `${RowHeight - RowPaddingY * 2}px`,
        width: "100%",
        display: "flex",
        py: 1,
        overflow: "hidden",
        maskImage: textTooBig
          ? "linear-gradient(to bottom, black 75%, transparent 90%)"
          : undefined,
      }}
    >
      {/* TODO: Pop open on mouse position.  This is popping on the bottom of the typography, which can be significantly offset due to our masking.*/}
      <Tooltip open={open} title={value}>
        <GameTypography
          ref={setTextRef}
          sx={{
            my: "auto",
          }}
          textOverflow="ellipsis"
          onMouseOver={onMouseOver}
          onMouseOut={() => setOpen(false)}
        >
          {value}
        </GameTypography>
      </Tooltip>
    </Box>
  );
}

export default TextWrapCell;
