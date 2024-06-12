import React from "react";

import { CompletedOrchestration } from "@/services/sh-game";

import ElementStackTray from "../Elements/ElementStackTray";

interface OrchestratorOutputProps {
  orchestration: CompletedOrchestration;
}

const OrchestrationOutput = ({ orchestration }: OrchestratorOutputProps) => {
  return <ElementStackTray elementStacks$={orchestration.content$} />;
};

export default OrchestrationOutput;
