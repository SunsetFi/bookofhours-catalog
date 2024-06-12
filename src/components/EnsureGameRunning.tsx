import React from "react";
import { Navigate } from "react-router-dom";

import { index as indexPath } from "@/paths";

import { useIsRunning } from "@/services/sh-game";

const EnsureGameRunning = () => {
  const isRunning = useIsRunning();

  if (isRunning === false) {
    return <Navigate to={indexPath()} />;
  }

  return null;
};

export default EnsureGameRunning;
