import * as React from "react";

import { useLegacy } from "@/services/sh-monitor/hooks";

import GameNotRunningView from "./views/GameNotRunningView";
import GameplayView from "./views/GameplayView";

const IndexPage = () => {
  const legacyId = useLegacy();

  return (
    <>
      {legacyId == null && <GameNotRunningView />}
      {legacyId != null && <GameplayView />}
    </>
  );
};

export default IndexPage;
