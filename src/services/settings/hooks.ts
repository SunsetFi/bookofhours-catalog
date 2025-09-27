import React from "react";

import { useDIDependency } from "@/container";

import { useObservation } from "@/hooks/use-observation";

import { SettingsManager } from "./SettingsManager";
import { Setting, SettingData } from "./settings";

export function useSetting<T extends Setting>(setting: T): SettingData[T] {
  const settingsManager = useDIDependency(SettingsManager);
  return (
    useObservation(() => settingsManager.getObservable(setting), []) ??
    settingsManager.get(setting)
  );
}

export function useSettingSetter<T extends Setting>(setting: T) {
  const settingsManager = useDIDependency(SettingsManager);
  return React.useCallback(
    (value: SettingData[T]) => settingsManager.set(setting, value),
    [settingsManager, setting],
  );
}
