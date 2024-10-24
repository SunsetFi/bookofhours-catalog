export interface SettingData {
  interactivity: "read-only" | "minimal" | "full";
  enableWisdomEditing: boolean;
  aspectFilterWidget: "grid" | "list";
  ignoreNewRelease: string | null;
}

export type Setting = keyof SettingData;

export const DefaultSettings: SettingData = {
  interactivity: "read-only",
  enableWisdomEditing: false,
  aspectFilterWidget: "list",
  ignoreNewRelease: null,
};

export type InteractivityMode = "read-only" | "minimal" | "full";
export const InteractivityPrecidence: Record<InteractivityMode, number> = {
  "read-only": 0,
  minimal: 1,
  full: 2,
};
