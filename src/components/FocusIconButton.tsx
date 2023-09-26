import * as React from "react";

import IconButton, { IconButtonProps } from "@mui/material/IconButton";
import VisibilityIcon from "@mui/icons-material/Visibility";

const FocusIconButton = (props: IconButtonProps) => (
  <IconButton title="Focus Camera on Item" {...props}>
    <VisibilityIcon />
  </IconButton>
);

export default FocusIconButton;
