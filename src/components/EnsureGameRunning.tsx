import * as React from "react";
import { Navigate } from "react-router-dom";

import { useDIDependency } from "@/container";

import { index as indexPath } from "@/paths";
import { useObservation } from "@/observables";

import { GameModel } from "@/services/sh-model/GameModel";

const EnsureGameRunning = () => {
  const monitor = useDIDependency(GameModel);
  const isRunning = useObservation(monitor.isRunning$) ?? undefined;

  if (isRunning == false) {
    return <Navigate to={indexPath()} />;
  }

  return null;
};

export default EnsureGameRunning;
