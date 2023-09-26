import * as React from "react";

import IconButton, { IconButtonProps } from "@mui/material/IconButton";
import ControlPointIcon from "@mui/icons-material/ControlPoint";

const CraftIconButton = (props: IconButtonProps) => (
  <IconButton title="Craft Item" {...props}>
    <ControlPointIcon />
  </IconButton>
);

export default CraftIconButton;
