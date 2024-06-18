import React from "react";
import { Navigate } from "react-router-dom";

import { index as indexPath } from "@/paths";

import { useIsLegacyRunning } from "@/services/sh-game";

const EnsureGameRunning = () => {
  const isRunning = useIsLegacyRunning();

  if (isRunning === false) {
    return <Navigate to={indexPath()} />;
  }

  return null;
};

export default EnsureGameRunning;
