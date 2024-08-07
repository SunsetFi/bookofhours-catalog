import React from "react";

import {
  InteractivityPrecidence,
  SettingData,
  useSetting,
} from "@/services/settings";

export interface RequireInteractivityProps {
  interactivity: SettingData["interactivity"];
  compare: "equal" | "greater" | "less";
  children: React.ReactNode;
}
const RequireInteractivity = ({
  interactivity,
  compare,
  children,
}: RequireInteractivityProps) => {
  const value = useSetting("interactivity");

  const currentPrecidence = value ? InteractivityPrecidence[value] : -1;
  const requiredPrecidence = InteractivityPrecidence[interactivity];

  if (value === undefined) {
    return;
  }

  const enabled = (() => {
    switch (compare) {
      case "equal":
        return currentPrecidence === requiredPrecidence;
      case "greater":
        return currentPrecidence >= requiredPrecidence;
      case "less":
        return currentPrecidence <= requiredPrecidence;
    }
  })();

  if (!enabled) {
    return null;
  }

  return children;
};

export default RequireInteractivity;
