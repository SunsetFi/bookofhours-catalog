import * as React from "react";
import { Navigate } from "react-router-dom";

import { useObservableState } from "observable-hooks";

import { useDIDependency } from "@/container";

import { GameModel } from "@/services/sh-monitor/GameModel";

import { index as indexPath } from "@/paths";

const EnsureGameRunning = () => {
  const monitor = useDIDependency(GameModel);
  const isRunning = useObservableState(monitor.isRunning$, false);

  if (!isRunning) {
    return <Navigate to={indexPath()} />;
  }

  return null;
};

export default EnsureGameRunning;
