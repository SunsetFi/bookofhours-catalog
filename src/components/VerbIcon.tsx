import React from "react";

import { Box, SxProps } from "@mui/material";

import { useDIDependency } from "@/container";

import { usePromise } from "@/hooks/use-promise";

import { Compendium } from "@/services/sh-compendium";
import { API } from "@/services/sh-api";

export interface VerbIconProps {
  sx?: SxProps;
  title?: string;
  maxWidth?: number;
  maxHeight?: number;
  verbId: string;
}

const VerbIcon = ({
  sx,
  title,
  maxWidth,
  maxHeight,
  verbId,
}: VerbIconProps) => {
  const api = useDIDependency(API);
  const compendium = useDIDependency(Compendium);
  const verb = usePromise(() => compendium.getVerbById(verbId), [verbId]);

  if (!verb) {
    return null;
  }

  if (!maxWidth && !maxHeight) {
    maxWidth = 40;
  }

  return (
    <Box
      sx={{
        width: maxWidth ? `${maxWidth}px` : undefined,
        height: maxHeight ? `${maxHeight}px` : undefined,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        ...sx,
      }}
    >
      <img
        loading="lazy"
        src={`${api.baseUrl}/api/compendium/verbs/${verbId}/icon.png`}
        alt={verb.label}
        title={title}
        style={{ maxWidth: "100%", maxHeight: "100%" }}
      />
    </Box>
  );
};

export default VerbIcon;
