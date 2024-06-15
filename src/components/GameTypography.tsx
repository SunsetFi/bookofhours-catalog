import React from "react";
import clsx from "clsx";

import Typography, { TypographyProps } from "@mui/material/Typography";

import AspectIcon from "./Aspects/AspectIcon";

export type GameTypographyProps = TypographyProps;

const GameTypography = React.forwardRef<HTMLSpanElement, GameTypographyProps>(
  ({ children, ...props }, ref) => {
    const parts = React.useMemo(
      () =>
        React.Children.toArray(children).flatMap((child, childIndex) => (
          <React.Fragment key={childIndex}>
            {typeof child === "string" ? parseGameText(child) : child}
          </React.Fragment>
        )),
      [children]
    );

    return (
      <Typography
        {...props}
        className={clsx("game-typography", props.className)}
        ref={ref}
      >
        {parts}
      </Typography>
    );
  }
);

export default GameTypography;

// const spriteRegex = /<sprite name=([^>]+)>/g;
// function parseSprites(
//   text: string,
//   fetchSprite: (name: string, index: number) => React.ReactNode
// ): React.ReactNode[] {
//   let count = 0;
//   let lastIndex = 0;
//   const result: React.ReactNode[] = [];

//   let match;
//   while ((match = spriteRegex.exec(text)) !== null) {
//     // Extract the text before the sprite
//     if (match.index > lastIndex) {
//       result.push(text.substring(lastIndex, match.index));
//     }

//     // Fetch the sprite and push to the result
//     const spriteName = match[1];
//     const spriteNode = fetchSprite(spriteName, ++count);
//     result.push(spriteNode);

//     lastIndex = match.index + match[0].length;
//   }

//   // If there's any remaining text after the last sprite, push it to the result
//   if (lastIndex < text.length) {
//     result.push(text.substring(lastIndex));
//   }

//   return result;
// }

type TransformFunction = (
  match: RegExpExecArray,
  index: number
) => React.ReactNode;

interface TransformRule {
  regex: RegExp;
  transform: TransformFunction;
}

const textTransformations: TransformRule[] = [
  {
    regex: /<sprite name=([^>]+)\/>/g,
    transform: (match, index) => {
      const spriteName = match[1];
      return (
        <AspectIcon
          key={index}
          size={30}
          aspectId={spriteName}
          sx={{ display: "inline-block", verticalAlign: "middle" }}
        />
      );
    },
  },
  {
    regex: /<i>(.*?)<\/i>/g,
    transform: (match, index) => {
      const text = match[1];
      return <i key={index}>{text}</i>;
    },
  },
];

function parseGameText(text: string): React.ReactNode[] {
  let index = 0;
  let nodes: React.ReactNode[] = [text];

  textTransformations.forEach(({ regex, transform }) => {
    const newNodes: React.ReactNode[] = [];

    nodes.forEach((node) => {
      if (typeof node === "string") {
        let lastIndex = 0;
        let match;
        while ((match = regex.exec(node)) !== null) {
          // Extract the text before the match
          if (match.index > lastIndex) {
            newNodes.push(node.substring(lastIndex, match.index));
          }

          // Apply the transformation function and push to the result
          newNodes.push(transform(match, ++index));

          lastIndex = match.index + match[0].length;
        }

        // If there's any remaining text after the last match, push it to the result
        if (lastIndex < node.length) {
          newNodes.push(node.substring(lastIndex));
        }
      } else {
        newNodes.push(node);
      }
    });

    nodes = newNodes;
  });

  return nodes;
}
