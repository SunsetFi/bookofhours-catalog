import React from "react";

import {
  Orchestration,
  isCompletedOrchestration,
  isOngoingOrchestration,
  isPendingOrchestration,
} from "@/services/sh-game";

import PendingOrchestrationContent from "./PendingOrchestrationContent";
import OngoingOrchestrationContent from "./OngoingOrchestrrationContent";
import CompletedOrchestrationContent from "./CompletedOrchestrationContent";

export interface OrchestrationContentProps {
  onBack(): void;
  orchestration: Orchestration;
}

const OrchestrationContent = ({
  orchestration,
  onBack,
}: OrchestrationContentProps) => {
  if (isPendingOrchestration(orchestration)) {
    return (
      <PendingOrchestrationContent
        orchestration={orchestration}
        onBack={onBack}
      />
    );
  } else if (isOngoingOrchestration(orchestration)) {
    return (
      <OngoingOrchestrationContent
        orchestration={orchestration}
        onBack={onBack}
      />
    );
  } else if (isCompletedOrchestration(orchestration)) {
    return (
      <CompletedOrchestrationContent
        orchestration={orchestration}
        onBack={onBack}
      />
    );
  }

  console.warn("Unknown orchestration type", orchestration);
  return null;
};

export default OrchestrationContent;
