import React from "react";
import { Observable, map } from "rxjs";

import Box from "@mui/material/Box";
import type { SxProps } from "@mui/material/styles";

import { observeAllMap } from "@/observables";

import { useObservation } from "@/hooks/use-observation";

import { ElementStackModel } from "@/services/sh-game";

import ElementStackCard, {
  DefaultElementStackCardHeight,
} from "./ElementStackCard";

export interface ElementStackTrayProps {
  sx?: SxProps;
  elementStacks$: Observable<readonly ElementStackModel[]>;
  requireExterior?: boolean;
  "aria-label"?: string;
  role?: string;
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
  "aria-label": ariaLabel,
  role,
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
