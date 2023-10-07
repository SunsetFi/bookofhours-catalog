import * as React from "react";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import { CellContext, RowData } from "@tanstack/react-table";

import { useComponentBounds } from "@/hooks/use-component-bounds";

import AspectIcon from "@/components/AspectIcon";

import { RowHeight, RowPaddingY } from "../constants";

function TextWrapCell<T extends RowData>(props: CellContext<T, string | null>) {
  const [containerRef, setContainerRef] = React.useState<HTMLDivElement | null>(
    null
  );
  const [textRef, setTextRef] = React.useState<HTMLSpanElement | null>(null);

  const { height: containerHeight } = useComponentBounds(containerRef);
  const { height: textHeight } = useComponentBounds(textRef);

  const [open, setOpen] = React.useState(false);

  const value = props.getValue();
  if (!value) {
    return null;
  }

  const parts = parseSprites(value, (name) => (
    <AspectIcon
      size={30}
      aspectId={name}
      sx={{ display: "inline-block", verticalAlign: "middle" }}
    />
  ));

  const textTooBig = textHeight > containerHeight;

  const onMouseOver = React.useCallback(() => {
    if (!textTooBig) {
      return;
    }

    setOpen(true);
  }, [textTooBig]);

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
      <Tooltip open={open} title={value}>
        <Typography
          ref={setTextRef}
          sx={{
            my: "auto",
          }}
          textOverflow="ellipsis"
          onMouseOver={onMouseOver}
          onMouseOut={() => setOpen(false)}
        >
          {parts.map((p, i) => (
            <React.Fragment key={i}>{p}</React.Fragment>
          ))}
        </Typography>
      </Tooltip>
    </Box>
  );
}

export default TextWrapCell;

// TODO: This should be its own component
// Regular expression to match <sprite name=foo> pattern
const spriteRegex = /<sprite name=([^>]+)>/g;
function parseSprites(
  text: string,
  fetchSprite: (name: string) => React.ReactNode
): React.ReactNode[] {
  let lastIndex = 0;
  const result: React.ReactNode[] = [];

  let match;
  while ((match = spriteRegex.exec(text)) !== null) {
    // Extract the text before the sprite
    if (match.index > lastIndex) {
      result.push(text.substring(lastIndex, match.index));
    }

    // Fetch the sprite and push to the result
    const spriteName = match[1];
    const spriteNode = fetchSprite(spriteName);
    result.push(spriteNode);

    lastIndex = match.index + match[0].length;
  }

  // If there's any remaining text after the last sprite, push it to the result
  if (lastIndex < text.length) {
    result.push(text.substring(lastIndex));
  }

  return result;
}
