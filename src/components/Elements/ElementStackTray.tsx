import React from "react";
import { Observable, map } from "rxjs";

import Box from "@mui/material/Box";
import type { SxProps } from "@mui/material/styles";

import { observeAllMap } from "@/observables";

import { useObservation } from "@/hooks/use-observation";

import { ElementStackModel } from "@/services/sh-game";

import ElementStackCard from "./ElementStackCard";

export interface ElementStackTrayProps {
  sx?: SxProps;
  elementStacks$: Observable<readonly ElementStackModel[]>;
  requireExterior?: boolean;
}

interface ElementStackTrayItem {
  elementStack: ElementStackModel;
  exterior: boolean;
}
function observeTrayItem(
  model: ElementStackModel
): Observable<ElementStackTrayItem> {
  return model.inExteriorSphere$.pipe(
    map((exterior) => ({
      elementStack: model,
      exterior,
    }))
  );
}

const ElementStackTray = ({
  elementStacks$,
  sx,
  requireExterior,
}: ElementStackTrayProps) => {
  const items = useObservation(
    () => elementStacks$.pipe(observeAllMap(observeTrayItem)),
    [elementStacks$]
  );

  if (!items) {
    return null;
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "flex-start",
        alignContent: "flex-start",
        isolation: "isolate",
        gap: 1,
        ...sx,
      }}
    >
      {items.map(
        ({ elementStack, exterior }) =>
          (exterior || !requireExterior) && (
            <ElementStackCard
              key={elementStack.id}
              elementStack={elementStack}
            />
          )
      )}
    </Box>
  );
};

export default ElementStackTray;
