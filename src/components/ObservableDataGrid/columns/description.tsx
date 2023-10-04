import * as React from "react";

import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

import { ModelWithDescription } from "@/services/sh-game";

import { ObservableDataGridColumnDef } from "../types";

import { textFilter } from "../filters";
import AspectIcon from "@/components/AspectIcon";

export function descriptionColumnDef<T extends ModelWithDescription>(
  additional: Partial<
    Omit<ObservableDataGridColumnDef<T>, "field" | "observable">
  > = {}
): ObservableDataGridColumnDef<T> {
  return {
    flex: additional.width === undefined ? 1 : undefined,
    filter: textFilter("description"),
    sortable: (a: string, b: string) => a.localeCompare(b),
    headerName: "Description",
    observable: (item) => item.description$,
    renderCell: ({ value }) => (
      <DescriptionRenderer>{value}</DescriptionRenderer>
    ),
    ...additional,
  };
}

interface DescriptionRendererProps {
  children: string | null;
}

const DescriptionRenderer = ({ children }: DescriptionRendererProps) => {
  if (!children) {
    return null;
  }

  const parts = parseSprites(children, (name) => (
    <AspectIcon
      size={30}
      aspectId={name}
      sx={{ display: "inline-block", m: "3px", verticalAlign: "middle" }}
    />
  ));

  return (
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <Typography
        variant="body2"
        sx={{ width: "100%", height: "100%", whiteSpace: "break-spaces" }}
      >
        {parts.map((p, i) => (
          <React.Fragment key={i}>{p}</React.Fragment>
        ))}
      </Typography>
    </Box>
  );
};

function parseSprites(
  text: string,
  fetchSprite: (name: string) => React.ReactNode
): React.ReactNode[] {
  // Regular expression to match <sprite name=foo> pattern
  const spriteRegex = /<sprite name=([^>]+)>/g;

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
