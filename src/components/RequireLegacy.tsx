import * as React from "react";

import { Navigate, useLocation } from "react-router";

import { useIsRunning } from "@/services/sh-model/hooks";

export const RequireRunning = () => {
  const path = useLocation().pathname;

  const isRunning = useIsRunning();
  if (isRunning === false) {
    console.log("Not running");
    return <Navigate to={`/?redirect=${path}`} />;
  }

  return null;
};
