import React from "react";

import { useDIDependency } from "@/container";

import { GameStateSource } from "@/services/sh-game";

import { useObservation } from "@/hooks/use-observation";

import GameNotRunningView from "./views/GameNotRunningView";
import GameplayView from "./views/GameplayView";
import LegacyNotRunningView from "./views/LegacyNotRunningView";

const IndexPage = () => {
  const gameStateSource = useDIDependency(GameStateSource);
  const isRunning =
    useObservation(gameStateSource.isGameRunning$) ??
    gameStateSource.isGameRunning;
  const isLegacyRunning =
    useObservation(gameStateSource.isLegacyRunning$) ??
    gameStateSource.isLegacyRunning;

  return (
    <>
      {isRunning === false && <GameNotRunningView />}
      {isRunning === true && isLegacyRunning === false && (
        <LegacyNotRunningView />
      )}
      {isRunning === true && isLegacyRunning === true && <GameplayView />}
    </>
  );
};

export default IndexPage;
