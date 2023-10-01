import * as React from "react";

import IconButton, { IconButtonProps } from "@mui/material/IconButton";
import VisibilityIcon from "@mui/icons-material/Visibility";

import { TokenModel } from "@/services/sh-game/token-models/TokenModel";

export interface FocusIconButtonProps {
  token: TokenModel;
}

const FocusIconButton = ({ token }: FocusIconButtonProps) => (
  <IconButton title="Focus Camera on Item" onClick={() => token.focus()}>
    <VisibilityIcon />
  </IconButton>
);

export default FocusIconButton;
