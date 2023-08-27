import * as React from "react";

import { Navigate, useLocation, useMatch } from "react-router";

import { useLegacy } from "@/services/sh-monitor/hooks";

export const RequireLegacy = () => {
  const path = useLocation().pathname;
  const legacy = useLegacy() ?? undefined;

  if (legacy == null) {
    console.log("RequireLegacy: no legacy");
    return <Navigate to={`/?redirect=${path}`} />;
  }

  return null;
};
