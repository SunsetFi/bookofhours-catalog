import * as React from "react";

import type { SxProps } from "@mui/material/styles";

import Box from "@mui/material/Box";

import { useObservation } from "@/observables";

import { useAspect } from "@/services/sh-compendium";

export interface AspectIconProps {
  aspectId: string;
  title?: string;
  size?: number;
  sx?: SxProps;
  onClick?(e: React.MouseEvent<HTMLElement>): void;
}

const AspectIcon = ({
  title,
  aspectId,
  size = 40,
  sx,
  onClick,
}: AspectIconProps) => {
  const aspect = useAspect(aspectId);
  const label = useObservation(`AspectIcon ${aspectId} label`, aspect.label$);

  return (
    <Box
      sx={{
        cursor: onClick ? "pointer" : undefined,
        ...sx,
      }}
      onClick={onClick}
    >
      <img
        style={{ display: "block" }}
        src={aspect.iconUrl}
        alt={title ?? label ?? ""}
        title={title ?? label ?? ""}
        width={size}
        height={size}
      />
    </Box>
  );
};

export default AspectIcon;
