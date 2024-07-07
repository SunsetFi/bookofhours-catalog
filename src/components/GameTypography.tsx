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
        {/* Bug fix: Edge typography div with minHeight causes it to shrink smaller than its content height.*/}
        <span role="presentation">{parts}</span>
      </Typography>
    );
  }
);

export default GameTypography;

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
    regex: /<sprite name=([^>]+)>/g,
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
  {
    regex: /<b>(.*?)<\/b>/g,
    transform: (match, index) => {
      const text = match[1];
      return <b key={index}>{text}</b>;
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
