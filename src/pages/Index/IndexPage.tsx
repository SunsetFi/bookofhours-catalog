import * as React from "react";

import { useIsRunning } from "@/services/sh-game";

import GameNotRunningView from "./views/GameNotRunningView";
import GameplayView from "./views/GameplayView";

const IndexPage = () => {
  const isRunning = useIsRunning();

  return (
    <>
      {isRunning === false && <GameNotRunningView />}
      {isRunning !== false && <GameplayView />}
    </>
  );
};

export default IndexPage;
