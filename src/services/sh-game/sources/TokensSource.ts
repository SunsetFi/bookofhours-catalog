import { startTransition } from "react";
import {
  Observable,
  Subject,
  combineLatest,
  distinctUntilChanged,
  map,
  shareReplay,
} from "rxjs";
import { inject, injectable, provides, singleton } from "microinject";
import { Token } from "secrethistories-api";
import { difference, sortBy } from "lodash";

import {
  distinctUntilShallowArrayChanged,
  filterItemObservations,
  filterItems,
  firstOrDefault,
} from "@/observables";

import { visibleSpherePaths } from "@/spheres";

import { Scheduler, TaskUnsubscriber } from "../../scheduler";
import { API } from "../../sh-api";

import { TokenModel } from "../token-models/TokenModel";
import { TokenModelFactory } from "../token-models/TokenModelFactory";
import {
  ConnectedTerrainModel,
  isConnectedTerrainModel,
} from "../token-models/ConnectedTerrainModel";
import {
  SituationModel,
  isSituationModel,
} from "../token-models/SituationModel";
import {
  ElementStackModel,
  isElementStackModel,
} from "../token-models/ElementStackModel";

import { filterTokenInPath } from "../observables";

import { RunningSource } from "./RunningSource";

const supportedPayloadTypes = [
  "ConnectedTerrain",
  "ElementStack",
  "Situation",
  "WorkstationSituation",
  "RoomWorkSituation",
];

@injectable()
@singleton()
@provides(TokensSource)
export class TokensSource {
  private _tokensTaskSubsciption: TaskUnsubscriber | null = null;
  private readonly _tokenModels: Map<string, TokenModel> = new Map();

  private readonly _tokensSubject$ = new Subject<readonly TokenModel[]>();

  constructor(
    @inject(Scheduler) scheduler: Scheduler,
    @inject(RunningSource) runningSource: RunningSource,
    @inject(API) private readonly _api: API,
    @inject(TokenModelFactory)
    private readonly _tokenModelFactory: TokenModelFactory
  ) {
    runningSource.isRunning$.subscribe((isRunning) => {
      if (!isRunning) {
        if (this._tokensTaskSubsciption) {
          this._tokensTaskSubsciption();
          this._tokensTaskSubsciption = null;
        }
      } else {
        if (!this._tokensTaskSubsciption) {
          this._tokensTaskSubsciption = scheduler.addTask(() =>
            this._pollTokens()
          );
        }
      }
    });
  }

  private readonly _tokens$ = this._tokensSubject$.pipe(
    distinctUntilShallowArrayChanged()
  );
  get tokens$(): Observable<readonly TokenModel[]> {
    return this._tokens$;
  }

  private readonly _visibleTokens$ = this._tokens$.pipe(
    filterItemObservations((model) => model.visible$),
    distinctUntilShallowArrayChanged(),
    shareReplay(1)
  );
  get visibleTokens$(): Observable<readonly TokenModel[]> {
    return this._visibleTokens$;
  }

  private _fixedSituations$: Observable<readonly SituationModel[]> | null =
    null;
  get fixedSituations$() {
    if (this._fixedSituations$ == null) {
      this._fixedSituations$ = this._tokens$.pipe(
        filterItems(isSituationModel),
        filterTokenInPath("~/fixedverbs"),
        distinctUntilShallowArrayChanged(),
        shareReplay(1)
      );
    }

    return this._fixedSituations$;
  }

  private _arrivalSituations$: Observable<readonly SituationModel[]> | null =
    null;
  get arrivalSituations$() {
    if (this._arrivalSituations$ == null) {
      this._arrivalSituations$ = this._tokens$.pipe(
        filterItems(isSituationModel),
        filterTokenInPath("~/arrivalverbs"),
        distinctUntilShallowArrayChanged(),
        shareReplay(1)
      );
    }

    return this._arrivalSituations$;
  }

  private _unlockingTerrainSituation$: Observable<SituationModel | null> | null =
    null;
  get unlockingTerrainSituation$() {
    if (!this._unlockingTerrainSituation$) {
      this._unlockingTerrainSituation$ = this._tokens$.pipe(
        // More nasty gnarly observable chains
        filterItems(isSituationModel),
        // This isnt an observable, but the situation is created and destroyed as it is used,
        // so this is safe.
        firstOrDefault((situation) => situation.verbId === "terrain.unlock"),
        distinctUntilChanged(),
        shareReplay(1)
      );
    }

    return this._unlockingTerrainSituation$;
  }

  private _visibleSituations$: Observable<SituationModel[]> | null = null;
  get visibleSituations$() {
    if (!this._visibleSituations$) {
      this._visibleSituations$ = combineLatest([
        this.fixedSituations$,
        this.arrivalSituations$,
        this.unlockingTerrainSituation$,
        this.unlockedWorkstations$,
        this.unlockedHarvestStations$,
      ]).pipe(
        map(([fixed, arrival, unlock, workstations, harvestStations]) => {
          const situations = [
            ...fixed,
            ...arrival,
            ...workstations,
            ...harvestStations,
          ];
          if (unlock) {
            situations.push(unlock);
          }
          return situations;
        }),
        shareReplay(1)
      );
    }

    return this._visibleSituations$;
  }

  private _unsealedTerrains$: Observable<
    readonly ConnectedTerrainModel[]
  > | null = null;
  get unsealedTerrains$() {
    if (!this._unsealedTerrains$) {
      this._unsealedTerrains$ = this._tokens$.pipe(
        filterItems(isConnectedTerrainModel),
        filterItemObservations((t) => t.sealed$.pipe(map((sealed) => !sealed))),
        distinctUntilShallowArrayChanged(),
        shareReplay(1)
      );
    }

    return this._unsealedTerrains$;
  }

  private _unlockedTerrains$: Observable<
    readonly ConnectedTerrainModel[]
  > | null = null;
  get unlockedTerrains$(): Observable<readonly ConnectedTerrainModel[]> {
    if (!this._unlockedTerrains$) {
      this._unlockedTerrains$ = this._tokens$.pipe(
        filterItems(isConnectedTerrainModel),
        distinctUntilShallowArrayChanged(),
        shareReplay(1)
      );
    }

    return this._unlockedTerrains$;
  }

  private _visibleElementStacks$: Observable<
    readonly ElementStackModel[]
  > | null = null;
  get visibleElementStacks$() {
    if (this._visibleElementStacks$ === null) {
      this._visibleElementStacks$ = this._visibleTokens$.pipe(
        filterItems(isElementStackModel),
        distinctUntilShallowArrayChanged(),
        shareReplay(1)
      );
    }

    return this._visibleElementStacks$;
  }

  private _unlockedWorkstations$: Observable<readonly SituationModel[]> | null =
    null;
  get unlockedWorkstations$() {
    if (!this._unlockedWorkstations$) {
      this._unlockedWorkstations$ = this._visibleTokens$.pipe(
        filterItems(isSituationModel),
        filterTokenInPath("~/library"),
        map((situations) =>
          situations.filter(
            (x) =>
              !x.verbId.startsWith("library.bed.") &&
              !x.verbId.startsWith("garden.") &&
              x.verbId != "world.beachcombing"
          )
        ),
        distinctUntilShallowArrayChanged(),
        shareReplay(1)
      );
    }

    return this._unlockedWorkstations$;
  }

  private _unlockedHarvestStations$: Observable<
    readonly SituationModel[]
  > | null = null;
  get unlockedHarvestStations$() {
    if (!this._unlockedHarvestStations$) {
      this._unlockedHarvestStations$ = this._visibleTokens$.pipe(
        filterItems(isSituationModel),
        map((situations) =>
          situations.filter(
            (x) =>
              x.verbId.startsWith("garden.") || x.verbId == "world.beachcombing"
          )
        ),
        distinctUntilShallowArrayChanged(),
        shareReplay(1)
      );
    }

    return this._unlockedHarvestStations$;
  }

  private async _pollTokens() {
    const thisUpdate = Date.now();

    const tokens = await this._api.getAllTokens({
      spherePrefix: visibleSpherePaths,
      payloadType: supportedPayloadTypes,
    });

    const existingTokenIds = Array.from(this._tokenModels.keys());
    const foundIds = tokens.map((t) => t.id);
    const tokenIdsToRemove = difference(existingTokenIds, foundIds);

    startTransition(() => {
      tokenIdsToRemove.forEach((id) => {
        const token = this._tokenModels.get(id);
        if (token) {
          token._retire();
          this._tokenModels.delete(id);
        }
      });

      const tokenModels = sortBy(
        tokens.map((token) => this._getOrUpdateTokenModel(token, thisUpdate)),
        "id"
      );

      this._tokensSubject$.next(tokenModels);
    });
  }

  private _getOrUpdateTokenModel(token: Token, timestamp: number): TokenModel {
    let model: TokenModel;
    if (!this._tokenModels.has(token.id)) {
      model = this._tokenModelFactory.create(token);
      this._tokenModels.set(token.id, model);
    } else {
      model = this._tokenModels.get(token.id)!;
      model._update(token, timestamp);
    }

    return model;
  }
}
