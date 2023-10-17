import * as React from "react";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { type SxProps } from "@mui/material/styles";

import { Null$ } from "@/observables";

import { ElementStackModel } from "@/services/sh-game";
import { useElement } from "@/services/sh-compendium";

import { useObservation } from "@/hooks/use-observation";

import GameTypography from "./GameTypography";

export interface TlgNoteProps {
  sx?: SxProps;
  elementStack: ElementStackModel;
}

const TlgNote = ({ sx, elementStack }: TlgNoteProps) => {
  const description = useObservation(elementStack.description$);
  const illuminations = useObservation(elementStack.illuminations$) ?? [];
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, ...sx }}>
      <Typography component="div" variant="body2">
        {description}
      </Typography>
      {Object.keys(illuminations).map((illumination) => (
        <TlgNoteIllumination key={illumination} data={illumination} />
      ))}
    </Box>
  );
};

export default TlgNote;

interface TlgNoteIlluminationProps {
  data: string;
}

const TlgNoteIllumination = ({ data }: TlgNoteIlluminationProps) => {
  const [type, mod1, mod2] = data.split("|");

  if (type === "xext") {
    return <ExtTlgNoteIllumination elementId={mod2} xext={mod1} />;
  }

  return null;
};

interface ExtTlgNoteIlluminationProps {
  elementId: string;
  xext: string;
}
const ExtTlgNoteIllumination = ({
  elementId,
  xext,
}: ExtTlgNoteIlluminationProps) => {
  const element = useElement(elementId);
  const xexts = useObservation(element?.xexts$ ?? Null$);

  const value = xexts?.[xext] ?? null;
  if (!value) {
    return null;
  }

  return (
    <GameTypography component="div" variant="body2">
      {value}
    </GameTypography>
  );
};
