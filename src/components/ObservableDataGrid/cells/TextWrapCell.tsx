import React from "react";

import { Box, Paper } from "@mui/material";

import { CellContext, RowData } from "@tanstack/react-table";

import { useComponentBounds } from "@/hooks/use-component-bounds";

import Tooltip from "../../Tooltip";
import GameTypography from "../../GameTypography";

import { RowHeight, RowPaddingY } from "../constants";

function TextWrapCell<T extends RowData>(props: CellContext<T, string | null>) {
  const [containerRef, setContainerRef] = React.useState<HTMLDivElement | null>(
    null,
  );
  const [textRef, setTextRef] = React.useState<HTMLSpanElement | null>(null);

  const { height: containerHeight } = useComponentBounds(containerRef);
  const { height: textHeight } = useComponentBounds(textRef);

  const textTooBig = textHeight > containerHeight;

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
        alignItems: textTooBig ? undefined : "center",
        py: 1,
        overflow: "hidden",
        maskImage: textTooBig
          ? "linear-gradient(to bottom, black 75%, transparent 90%)"
          : undefined,
      }}
    >
      {/* TODO: Pop open on mouse position.  This is popping on the bottom of the typography, which can be significantly offset due to our masking.*/}
      <Tooltip
        disabled={!textTooBig}
        title={
          <Paper sx={{ maxWidth: 400, p: 3 }}>
            <GameTypography>{value}</GameTypography>
          </Paper>
        }
      >
        <GameTypography
          ref={setTextRef}
          sx={{
            my: "auto",
          }}
          textOverflow="ellipsis"
        >
          {value}
        </GameTypography>
      </Tooltip>
    </Box>
  );
}

export default TextWrapCell;
