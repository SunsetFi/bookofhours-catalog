import React from "react";

import { IconButton } from "@mui/material";
import { Visibility as VisibilityIcon } from "@mui/icons-material";

import { TokenModel } from "@/services/sh-game/token-models/TokenModel";

export interface FocusIconButtonProps {
  token: TokenModel;
}

const FocusIconButton = ({ token }: FocusIconButtonProps) => {
  const onClick = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    token.focus();
  }, []);

  return (
    <IconButton title="Focus Camera on Item" onClick={onClick}>
      <VisibilityIcon />
    </IconButton>
  );
};

export default FocusIconButton;
