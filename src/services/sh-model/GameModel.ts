import { inject, injectable, singleton, provides } from "microinject";
import { BehaviorSubject, Observable, combineLatest, map } from "rxjs";
import { ConnectedTerrain, ElementStack, Token } from "secrethistories-api";
import { difference, isEqual, sortBy } from "lodash";
import { DateTime } from "luxon";

// The date of first arrival, according to the legacy name.
const startDate = DateTime.fromISO("1936-03-07T00:00:00.000Z");

import { arrayDistinctShallow, observeAll } from "@/observables";

import { Initializable } from "../Initializable";

import { API } from "../sh-api";

import { ElementModel } from "../sh-compendium/ElementModel";
import { Compendium } from "../sh-compendium/Compendium";

import {
  ElementStackModel,
  isElementStackModel,
} from "./models/ElementStackModel";
import {
  ConnectedTerrainModel,
  isConnectedTerrainModel,
} from "./models/ConnectedTerrainModel";
import { TokenModel } from "./models/TokenModel";
import { SituationModel } from "./models/SituationModel";

const pollRate = 1000;

const playerSpherePaths = [
  "~/portage1",
  "~/portage2",
  "~/portage3",
  "~/portage4",
  "~/portage5",
  "~/hand.abilities",
  "~/hand.skills",
  "~/hand.memories",
  "~/hand.misc",
];

const supportedPayloadTypes = [
  "ConnectedTerrain",
  "ElementStack",
  "Situation",
  "WorkstationSituation",
];

@injectable()
@singleton()
@provides(Initializable)
export class GameModel implements Initializable {
  private readonly _isRunning$ = new BehaviorSubject<boolean>(false);
  private readonly _fault$ = new BehaviorSubject<string | null>(null);

  private readonly _isGameLoaded$ = new BehaviorSubject<boolean>(false);

  private readonly _uniqueElementIdsManfiested$ = new BehaviorSubject<
    readonly string[]
  >([]);
  private readonly _recipeExecutions$ = new BehaviorSubject<
    Readonly<Record<string, number>> | undefined
  >(undefined);

  // This is marked as internal use only as we do not distinct its values, and the observable will produce a new value every poll.
  private readonly _tokensInternalUseOnly$ = new BehaviorSubject<
    readonly Token[]
  >([]);

  private readonly _tokenModelMap = new Map<string, TokenModel>();
  // This is marked as internal use only as we do not distinct its values, and the observable will produce a new value every poll.
  private readonly _tokenModelsInternalUseOnly$ = new BehaviorSubject<
    readonly TokenModel[]
  >([]);

  private readonly _elementStackModels$: Observable<
    readonly ElementStackModel[]
  >;

  private readonly _terrainModels$: Observable<
    readonly ConnectedTerrainModel[]
  >;

  private readonly _unlockedTerrains$: Observable<
    readonly ConnectedTerrainModel[]
  >;

  private readonly _visibleElementStacks$: Observable<
    readonly ElementStackModel[]
  >;

  private readonly _uniqueElementsManifested$: Observable<
    readonly ElementModel[]
  >;

  private readonly _date$: Observable<DateTime>;

  constructor(
    @inject(API) private readonly _api: API,
    @inject(Compendium) private readonly _compendium: Compendium
  ) {
    this._tokensInternalUseOnly$.subscribe((tokens) => {
      const supportedTokens = tokens.filter((x) =>
        supportedPayloadTypes.includes(x.payloadType)
      );

      const existingTokenIds = Array.from(this._tokenModelMap.keys());
      const tokenIdsToRemove = difference(
        existingTokenIds,
        supportedTokens.map((x) => x.id)
      );
      tokenIdsToRemove.forEach((id) => this._tokenModelMap.delete(id));

      const tokenModels = sortBy(
        supportedTokens.map((token) => this._getOrUpdateTokenModel(token)),
        "id"
      );

      // We could do this as a pipe, but the side effect of deleting the old models gives me pause.
      this._tokenModelsInternalUseOnly$.next(tokenModels);
    });

    this._elementStackModels$ = this._tokenModelsInternalUseOnly$.pipe(
      map((models) => models.filter(isElementStackModel)),
      arrayDistinctShallow()
    );

    this._terrainModels$ = this._tokenModelsInternalUseOnly$.pipe(
      map((models) => models.filter(isConnectedTerrainModel)),
      arrayDistinctShallow()
    );

    this._unlockedTerrains$ = this._terrainModels$.pipe(
      map((models) =>
        models.map((model) =>
          model.shrouded$.pipe(map((shrouded) => ({ model, shrouded })))
        )
      ),
      observeAll(),
      map((models) =>
        models.filter((x) => x.shrouded == false).map((x) => x.model)
      ),
      arrayDistinctShallow()
    );

    const visibleSpherePaths$ = this._unlockedTerrains$.pipe(
      map((terrains) => [...playerSpherePaths, ...terrains.map((t) => t.path)]),
      map((paths) => Array.from(new Set(paths)))
    );

    this._visibleElementStacks$ = combineLatest([
      // Items can move around but keep their model, so we need to observe their paths
      this._elementStackModels$.pipe(
        map((models) =>
          models.map((model) =>
            model.path$.pipe(map((path) => ({ model, path })))
          )
        ),
        observeAll()
      ),
      visibleSpherePaths$,
    ]).pipe(
      map(([elementStackModels, visibleSpherePaths]) =>
        elementStackModels
          .filter(({ path }) =>
            visibleSpherePaths.some((p) => path.startsWith(p))
          )
          .map(({ model }) => model)
      ),
      arrayDistinctShallow()
    );

    this._date$ = this._recipeExecutions$.pipe(
      map((recipeExecutions) => {
        if (!recipeExecutions) {
          return DateTime.invalid("No recipe executions");
        }

        const daysPassed = recipeExecutions["day.dawn"] ?? 0;
        return startDate.plus({ days: daysPassed });
      })
    );

    this._uniqueElementsManifested$ = this._uniqueElementIdsManfiested$.pipe(
      map((ids) => ids.map((id) => _compendium.getElementById(id))),
      arrayDistinctShallow()
    );
  }

  get isRunning$() {
    return this._isRunning$;
  }

  get isGameLoaded$() {
    return this._isGameLoaded$;
  }

  get date$() {
    return this._date$;
  }

  get visibleElementStacks$() {
    return this._visibleElementStacks$;
  }

  get unlockedTerrains$() {
    return this._unlockedTerrains$;
  }

  get uniqueElementsManifested$() {
    return this._uniqueElementsManifested$;
  }

  onInitialize() {
    this._poll();
  }

  private _scheduleNextPoll() {
    setTimeout(() => this._poll(), pollRate);
  }

  private async _poll() {
    try {
      const legacy = await this._api.getLegacy();
      if (!legacy) {
        this._clear();
        return;
      }

      this._isRunning$.next(true);

      await this._pollTokens();
      await this._pollManifestations();
      await this._pollRecipeExecutions();
    } catch (e: any) {
      console.error(e);
      this._clear();
      this._fault$.next(e.message);
    } finally {
      this._scheduleNextPoll();
    }
  }

  private async _pollTokens() {
    const tokens = await this._api.getAllTokens();
    this._tokensInternalUseOnly$.next(tokens);
  }

  private async _pollManifestations() {
    const manifestations = await this._api.getUniqueManifestedElements();
    if (!isEqual(manifestations, this._uniqueElementIdsManfiested$.value)) {
      this._uniqueElementIdsManfiested$.next(manifestations);
    }
  }

  private async _pollRecipeExecutions() {
    const recipeExecutions = await this._api.getRecipeExecutions();
    if (!isEqual(recipeExecutions, this._recipeExecutions$.value)) {
      this._recipeExecutions$.next(recipeExecutions);
    }
  }

  private async _clear() {
    this._isRunning$.next(false);
    this._fault$.next(null);
  }

  private _getOrUpdateTokenModel(token: Token): TokenModel {
    let model = this._tokenModelMap.get(token.id);
    if (!model) {
      switch (token.payloadType) {
        case "ConnectedTerrain":
          model = new ConnectedTerrainModel(token as ConnectedTerrain);
          break;
        case "ElementStack":
          model = new ElementStackModel(
            token as ElementStack,
            this._api,
            this,
            this._compendium
          );
          break;
        case "Situation":
        case "WorkstationSituation" as any:
          model = new SituationModel(token as any, this._api);
          break;
        default:
          throw new Error(
            `Unknown token payload type: ${(token as any).payloadType}`
          );
      }
      this._tokenModelMap.set(token.id, model);
    }

    model._onUpdate(token);
    return model;
  }
}
