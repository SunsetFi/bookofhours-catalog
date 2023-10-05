import * as React from "react";
import { Observable } from "rxjs";

import Box from "@mui/material/Box";
import type { SxProps } from "@mui/material/styles";

import { useObservation } from "@/observables";

import { ElementStackModel } from "@/services/sh-game";
import ElementStackTrayCard from "./ElementStackTrayCard";

export interface ElementStackTrayProps {
  sx?: SxProps;
  elementStacks$: Observable<readonly ElementStackModel[]>;
}

const ElementStackTray = ({ elementStacks$, sx }: ElementStackTrayProps) => {
  const elementStacks = useObservation(elementStacks$);

  if (!elementStacks) {
    return null;
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "flex-start",
        alignItems: "flex-start",
        alignContent: "flex-start",
        gap: 1,
        ...sx,
      }}
    >
      {elementStacks.map((elementStack) => (
        <ElementStackTrayCard
          key={elementStack.id}
          elementStack={elementStack}
        />
      ))}
    </Box>
  );
};

export default ElementStackTray;
