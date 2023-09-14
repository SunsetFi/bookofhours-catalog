import { Identifier } from "microinject";
import { Observable } from "rxjs";

import { TokenModel } from "../token-models/TokenModel";
import { RecipeModel } from "@/services/sh-compendium";

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

export const CraftablesSource: Identifier<CraftablesSource> =
  Symbol("CraftablesSource");
export interface CraftablesSource {
  get unlockedRecipes$(): Observable<readonly RecipeModel[]>;
}