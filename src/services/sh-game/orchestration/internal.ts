/**
 * What to do when a situation state changes.
 * - `update-orchestration`: The orchestration should be recreated depending on the situation's state
 * - `null`: The orchestration should not be updated.
 */
export type SituationStateChangedResponse =
  | "update-orchestration"
  | "clear-orchestration"
  | null;
