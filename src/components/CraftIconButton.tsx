import React from "react";

import { IconButton, IconButtonProps } from "@mui/material";
import { PlayCircle } from "@mui/icons-material";

const CraftIconButton = (props: IconButtonProps) => (
  <IconButton
    title="Craft Item"
    aria-controls="orchestration-drawer"
    {...props}
  >
    <PlayCircle />
  </IconButton>
);

export default CraftIconButton;
