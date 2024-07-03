import React from "react";

import { Lock as LockIcon } from "@mui/icons-material";

import { Box, SxProps } from "@mui/material";

import { WisdomNodeTerrainModel } from "@/services/sh-game";

import { useObservation } from "@/hooks/use-observation";

import ElementStackCard, {
  DefaultElementStackCardHeight,
  DefaultElementStackCardWidth,
} from "@/components/Elements/ElementStackCard";

export interface WisdomNodeSlotProps {
  sx?: SxProps;
  node: WisdomNodeTerrainModel;
}

const WisdomNodeSlot = ({ node }: WisdomNodeSlotProps) => {
  const committed = useObservation(node.committed$);
  const sealed = useObservation(node.sealed$);
  return (
    <Box
      sx={{
        width: DefaultElementStackCardWidth + 5,
        height: DefaultElementStackCardHeight + 5,
        border: "2px solid #888",
        borderRadius: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {committed == null && sealed && <LockIcon />}
      {committed && (
        <ElementStackCard elementStack={committed} interactable={false} />
      )}
    </Box>
  );
};

export default WisdomNodeSlot;
