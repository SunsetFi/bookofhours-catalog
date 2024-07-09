import {
  Observable,
  Subject,
  combineLatest,
  distinctUntilChanged,
  filter,
  map,
  shareReplay,
} from "rxjs";
import { inject, injectable, provides, singleton } from "microinject";
import { APINetworkError, PayloadType, Token } from "secrethistories-api";
import { difference, flatten, sortBy, uniqBy } from "lodash";

import {
  distinctUntilShallowArrayChanged,
  filterItemObservations,
  filterItems,
  firstOrDefault,
} from "@/observables";

import { applicableSpherePaths } from "@/spheres";

import { UpdatePoller, TaskUnsubscriber } from "../../update-poller";
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

import { GameStateSource } from "./GameStateSource";
import { BatchingScheduler } from "@/services/scheduler";
import {
  WisdomNodeTerrainModel,
  isWisdomNodeTerrainModel,
} from "../token-models/WisdomNodeTerrainModel";

const supportedPayloadTypes: PayloadType[] = [
  "ConnectedTerrain",
  "ElementStack",
  "Situation",
  "WorkstationSituation",
  "RoomWorkSituation",
  "WisdomNodeTerrain",
];

const WisdomTreeCommittmentRegex =
  /\~\/wisdomtreenodes\!([a-zA-Z0-9\.])+\/commitment/;

@injectable()
@singleton()
@provides(TokensSource)
export class TokensSource {
  private _tokensTaskSubsciption: TaskUnsubscriber | null = null;
  private readonly _tokenModels: Map<string, TokenModel> = new Map();

  private readonly _tokensSubject$ = new Subject<readonly TokenModel[]>();

  constructor(
    @inject(UpdatePoller) poller: UpdatePoller,
    @inject(GameStateSource) runningSource: GameStateSource,
    @inject(API) private readonly _api: API,
    @inject(TokenModelFactory)
    private readonly _tokenModelFactory: TokenModelFactory,
    @inject(BatchingScheduler) private readonly _scheduler: BatchingScheduler
  ) {
    runningSource.isLegacyRunning$.subscribe((isRunning) => {
      if (!isRunning) {
        if (this._tokensTaskSubsciption) {
          this._tokensTaskSubsciption();
          this._tokensTaskSubsciption = null;

          this._tokenModels.forEach((x) => x._retire());
          this._tokenModels.clear();
          this._tokensSubject$.next([]);
        }
      } else {
        if (!this._tokensTaskSubsciption) {
          this._tokensTaskSubsciption = poller.addTask(() =>
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
    // Dont count committed wisdom tree nodes as visible.
    // This is a bit hackish, but we don't want the duplicate skills to appear as somethig we 'have'.
    // WisdomNodeModel uses tokens$ directly and skips this, so it is unaffected.
    map((models) =>
      models.filter(
        (model) => !WisdomTreeCommittmentRegex.test(model.spherePath)
      )
    ),
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

  private _wisdomTreeNodes$: Observable<
    readonly WisdomNodeTerrainModel[]
  > | null = null;
  get wisdomTreeNodes$() {
    if (!this._wisdomTreeNodes$) {
      this._wisdomTreeNodes$ = this._tokens$.pipe(
        filterItems(isWisdomNodeTerrainModel),
        distinctUntilShallowArrayChanged(),
        shareReplay(1)
      );
    }

    return this._wisdomTreeNodes$;
  }

  private async _pollTokens() {
    const thisUpdate = Date.now();

    let tokens: Token[];
    try {
      // Looks like most of the time is taken serializing.
      // We can lower our query time like this, but we really should make
      // the actual endpoint faster and run in parallel.
      const brk = Math.round(this._tokenModels.size / 2);
      // We used to read async, but I'm seeing threading issues, possibly due to caching on aspect dictionaries
      const shouldSplit = false; //brk > 100;
      const [first, second] = await Promise.all([
        this._api.getAllTokens({
          fucinePath: applicableSpherePaths,
          payloadType: supportedPayloadTypes,
          limit: shouldSplit ? brk : undefined,
        }),
        shouldSplit
          ? this._api.getAllTokens({
              fucinePath: applicableSpherePaths,
              payloadType: supportedPayloadTypes,
              skip: brk,
            })
          : Promise.resolve([]),
      ]);

      tokens = flatten([first, second]);
    } catch (e) {
      // Happens on occasion, probably as a result of us no longer
      // thread locking reads.
      if (e instanceof APINetworkError && e.statusCode === 500) {
        console.warn("Failed to fetch tokens due to internal error", e.message);
        return;
      }

      throw e;
    }

    const prevTokens = tokens;
    tokens = uniqBy(tokens, "id");
    if (tokens.length !== prevTokens.length) {
      // We were receiving duplicates for a bit.
      // This could be the result of overlapping fucinePath items, but that shouldn't
      // be the case for us.
      // Either way I added a distinct filter to the api to nip that, so the only remaining possibility is
      // our two calls return overlapping tokens.
      console.warn(
        "Received",
        prevTokens.length,
        "tokens, but only",
        tokens.length,
        "were unique."
      );
    }

    const existingTokenIds = Array.from(this._tokenModels.keys());
    const foundIds = tokens.map((t) => t.id);
    const tokenIdsToRemove = difference(existingTokenIds, foundIds);

    await this._scheduler.batchUpdate(async () => {
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
