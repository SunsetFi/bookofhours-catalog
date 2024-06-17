import React from "react";

import IconButton, { IconButtonProps } from "@mui/material/IconButton";
import PlayCircle from "@mui/icons-material/PlayCircle";

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
