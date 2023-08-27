import * as React from "react";
import { useObservableState } from "observable-hooks";

import { useDIDependency } from "@/container";
import { GameModel } from "@/services/sh-monitor/GameModel";

import GameNotRunningView from "./views/GameNotRunningView";
import GameplayView from "./views/GameplayView";

const IndexPage = () => {
  const monitor = useDIDependency(GameModel);
  const legacyId = useObservableState(monitor.legacyId$, null);

  return (
    <>
      {legacyId == null && <GameNotRunningView />}
      {legacyId != null && <GameplayView />}
    </>
  );
};

export default IndexPage;
