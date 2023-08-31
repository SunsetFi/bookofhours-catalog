import * as React from "react";

import type { SxProps } from "@mui/material/styles";

import Box from "@mui/material/Box";
import { useObservation } from "@/observables";
import { useAspect } from "@/services/sh-compendium/hooks";

export interface AspectIconProps {
  aspectId: string;
  size?: number;
  sx?: SxProps;
  onClick?(e: React.MouseEvent<HTMLElement>): void;
}

const AspectIcon = ({ aspectId, size = 40, sx, onClick }: AspectIconProps) => {
  const aspect = useAspect(aspectId);
  const label = useObservation(aspect.label$);

  if (!label) {
    return null;
  }

  return (
    <Box
      sx={{
        cursor: onClick ? "pointer" : undefined,
        ...sx,
      }}
    >
      <img src={aspect.iconUrl} alt={label} width={size} height={size} />
    </Box>
  );
};

export default AspectIcon;
