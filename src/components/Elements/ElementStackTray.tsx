import React from "react";
import { Observable } from "rxjs";

import { Box, SxProps, CircularProgress } from "@mui/material";

import { useObservation } from "@/hooks/use-observation";

import { ElementStackModel } from "@/services/sh-game";

import ElementStackCard, {
  DefaultElementStackCardHeight,
} from "./ElementStackCard";

export interface ElementStackTrayProps {
  sx?: SxProps;
  elementStacks$: Observable<readonly ElementStackModel[]>;
  "aria-label"?: string;
  role?: string;
  emptyContent?: React.ReactNode;
  value?: ElementStackModel | null;
  onClick?(elementStack: ElementStackModel): void;
}

const ElementStackTray = ({
  elementStacks$,
  sx,
  "aria-label": ariaLabel,
  role,
  emptyContent,
  value,
  onClick,
}: ElementStackTrayProps) => {
  const items = useObservation(elementStacks$);

  return (
    <Box
      aria-label={ariaLabel}
      role={role}
      sx={{
        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "flex-start",
        alignContent: "flex-start",
        isolation: "isolate",
        gap: 1,
        minHeight: DefaultElementStackCardHeight,
        ...sx,
      }}
    >
      {!items && <CircularProgress color="inherit" />}
      {items &&
        items.map((elementStack) => (
          <ElementStackCard
            sx={{
              ["& .element-stack-card--card"]: {
                border: value === elementStack ? "4px solid white" : undefined,
              },
            }}
            key={elementStack.id}
            elementStack={elementStack}
            onClick={onClick ? () => onClick(elementStack) : undefined}
          />
        ))}
      {items && items.length === 0 && emptyContent}
    </Box>
  );
};

export default ElementStackTray;
