import * as React from "react";

import Typography, { TypographyProps } from "@mui/material/Typography";
import AspectIcon from "./AspectIcon";

export type GameTypographyProps = TypographyProps;

const GameTypography = React.forwardRef<HTMLSpanElement, GameTypographyProps>(
  ({ children, ...props }, ref) => {
    const parts = React.useMemo(
      () =>
        React.Children.toArray(children).flatMap((child, index) => {
          if (typeof child === "string") {
            return parseSprites(child, (name, spriteIndex) => (
              <AspectIcon
                key={`${index}-${spriteIndex}`}
                size={30}
                aspectId={name}
                sx={{ display: "inline-block", verticalAlign: "middle" }}
              />
            ));
          }

          return child;
        }),
      [children]
    );

    return (
      <Typography ref={ref} {...props}>
        {parts}
      </Typography>
    );
  }
);

export default GameTypography;

const spriteRegex = /<sprite name=([^>]+)>/g;
function parseSprites(
  text: string,
  fetchSprite: (name: string, index: number) => React.ReactNode
): React.ReactNode[] {
  let count = 0;
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
    const spriteNode = fetchSprite(spriteName, ++count);
    result.push(spriteNode);

    lastIndex = match.index + match[0].length;
  }

  // If there's any remaining text after the last sprite, push it to the result
  if (lastIndex < text.length) {
    result.push(text.substring(lastIndex));
  }

  return result;
}
