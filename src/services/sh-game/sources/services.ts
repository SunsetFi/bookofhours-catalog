import { Identifier } from "microinject";
import { Observable } from "rxjs";

import { ConnectedTerrainModel } from "../token-models/ConnectedTerrainModel";
import { TokenModel } from "../token-models/TokenModel";

export const RunningSource: Identifier<RunningSource> = Symbol("RunningSource");
export interface RunningSource {
  get isRunning$(): Observable<boolean>;
  get isRunning(): boolean;
}

export const TerrainsSource: Identifier<TerrainsSource> =
  Symbol("TerrainsSource");
export interface TerrainsSource {
  get unlockedTerrains$(): Observable<readonly ConnectedTerrainModel[]>;
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
  get recipeExecutions$(): Observable<Readonly<Record<string, number>>>;
  get recipeExecutions(): Readonly<Record<string, number>>;
}
