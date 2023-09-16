import { Identifier } from "microinject";
import { Observable } from "rxjs";

import { TokenModel } from "../token-models/TokenModel";
import { RecipeModel } from "@/services/sh-compendium";
import { SituationModel } from "../token-models/SituationModel";
import { GameSpeed } from "secrethistories-api";

export const RunningSource: Identifier<RunningSource> = Symbol("RunningSource");
export interface RunningSource {
  get isRunning$(): Observable<boolean>;
  get isRunning(): boolean;
}

export const TokensSource: Identifier<TokensSource> = Symbol("TokensSource");
export interface TokensSource {
  get tokens$(): Observable<readonly TokenModel[]>;
}

export const CharacterSource: Identifier<CharacterSource> =
  Symbol("CharacterSource");
export interface CharacterSource {
  get uniqueElementIdsManifested$(): Observable<readonly string[]>;
  get uniqueElementIdsManifested(): readonly string[];
  get ambittableRecipes$(): Observable<readonly string[]>;
  get ambittableRecipes(): readonly string[];
}

export const CraftingSource: Identifier<CraftingSource> =
  Symbol("CraftingSource");
export interface CraftingSource {
  get unlockedRecipes$(): Observable<readonly RecipeModel[]>;
  get unlockedWorkstations$(): Observable<readonly SituationModel[]>;
  get unlockedHarvestStations$(): Observable<readonly SituationModel[]>;
}

export const TimeSource: Identifier<TimeSource> = Symbol("TimeSource");
export interface TimeSource {
  get gameSpeed$(): Observable<GameSpeed | null>;
}
