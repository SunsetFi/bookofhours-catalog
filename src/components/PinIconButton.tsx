import * as React from "react";

import IconButton, { IconButtonProps } from "@mui/material/IconButton";
import PushPin from "@mui/icons-material/PushPin";

const PinIconButton = (props: IconButtonProps) => (
  <IconButton title="Pin Item" {...props}>
    <PushPin />
  </IconButton>
);

export default PinIconButton;
