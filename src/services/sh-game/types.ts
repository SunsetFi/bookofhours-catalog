import { Observable } from "rxjs";

import { Aspects } from "secrethistories-api";

import { ConnectedTerrainModel } from "./token-models/ConnectedTerrainModel";

export interface ModelWithLabel {
  label$: Observable<string | null>;
}

export interface ModelWithDescription {
  description$: Observable<string | null>;
}

export interface ModelWithAspects {
  aspects$: Observable<Aspects>;
}

export interface ModelWithIconUrl {
  iconUrl$: Observable<string>;
}

export interface ModelWithParentTerrain {
  parentTerrain$: Observable<ConnectedTerrainModel | null>;
}
