import { inject, injectable, singleton, provides } from "microinject";
import {
  BehaviorSubject,
  Observable,
  combineLatest,
  map,
  distinctUntilChanged,
} from "rxjs";
import { ConnectedTerrain, ElementStack, Token } from "secrethistories-api";
import { difference, sortBy } from "lodash";

import { Initializable } from "../Initializable";

import { API } from "../sh-api";

import { isConnectedTerrain, isElementStack } from "./utils";
import { ElementStackModel } from "./ElementStackModel";
import { ConnectedTerrainModel } from "./ConnectedTerrainModel";
import { observeAll } from "@/observables";

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

@injectable()
@singleton()
@provides(Initializable)
export class GameModel implements Initializable {
  private readonly _elementStackModels = new Map<string, ElementStackModel>();
  private readonly _connectedTerrainModels = new Map<
    string,
    ConnectedTerrainModel
  >();

  private readonly _isRunning$ = new BehaviorSubject<boolean>(false);
  private readonly _fault$ = new BehaviorSubject<string | null>(null);

  private readonly _isGameLoaded$ = new BehaviorSubject<boolean>(false);

  private readonly _legacyId$ = new BehaviorSubject<string | null>(null);
  private readonly _legacyLabel$ = new BehaviorSubject<string | null>(null);

  // This is marked as internal use only as we do not distinct its values, and it is constantly changing as we poll.
  private readonly _tokensInternalUseOnly$ = new BehaviorSubject<
    readonly Token[]
  >([]);

  private readonly _elementStackModels$ = new BehaviorSubject<
    readonly ElementStackModel[]
  >([]);

  private readonly _terrainModels$ = new BehaviorSubject<
    readonly ConnectedTerrainModel[]
  >([]);

  private readonly _unlockedTerrains$: Observable<
    readonly ConnectedTerrainModel[]
  >;
  private readonly _visibleElementStacks$: Observable<
    readonly ElementStackModel[]
  >;

  private readonly _visibleReadables$: Observable<readonly ElementStackModel[]>;

  constructor(@inject(API) private readonly _api: API) {
    this._tokensInternalUseOnly$.subscribe((tokens) => {
      // Process element stacks.
      const elementStacks = tokens.filter(isElementStack);
      const elementModelIds = Array.from(this._elementStackModels.keys());
      const modelIdsToRemove = difference(
        elementModelIds,
        elementStacks.map((x) => x.id)
      );
      modelIdsToRemove.forEach((id) => this._elementStackModels.delete(id));
      const elementStackModels = elementStacks.map((elementStack) =>
        this._getOrUpdateElementStackModel(elementStack)
      );
      this._elementStackModels$.next(sortBy(elementStackModels, "id"));

      // Process terrains.
      const terrains = tokens.filter(isConnectedTerrain);
      const terrainModelIds = Array.from(this._connectedTerrainModels.keys());
      const terrainIdsToRemove = difference(
        terrainModelIds,
        terrains.map((x) => x.id)
      );
      terrainIdsToRemove.forEach((id) =>
        this._connectedTerrainModels.delete(id)
      );
      const terrainModels = terrains.map((x) =>
        this._getOrUpdateConnectedTerrainModel(x)
      );
      this._terrainModels$.next(sortBy(terrainModels, "id"));
    });

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
      distinctUntilChanged(arrayShallowEquals)
    );

    const visibleSpherePaths = this._unlockedTerrains$.pipe(
      map((terrains) => [...playerSpherePaths, ...terrains.map((t) => t.path)]),
      map((paths) => Array.from(new Set(paths)))
    );

    this._visibleElementStacks$ = combineLatest([
      this._elementStackModels$.pipe(
        map((models) =>
          models.map((model) =>
            model.path$.pipe(map((path) => ({ model, path })))
          )
        ),
        observeAll()
      ),
      visibleSpherePaths,
    ]).pipe(
      map(([elementStackModels, visibleSpherePaths]) =>
        elementStackModels
          .filter(({ path }) =>
            visibleSpherePaths.some((p) => path.startsWith(p))
          )
          .map(({ model }) => model)
      ),
      distinctUntilChanged(arrayShallowEquals)
    );

    this._visibleReadables$ = this._visibleElementStacks$.pipe(
      map((stacks) =>
        stacks.map((stack) =>
          stack.elementAspects$.pipe(map((aspects) => ({ stack, aspects })))
        )
      ),
      observeAll(),
      map((items) => items.filter((x) => x.aspects["readable"] > 0)),
      map((items) => items.map((x) => x.stack)),
      distinctUntilChanged(arrayShallowEquals)
    );
  }

  get isRunning$() {
    return this._isRunning$;
  }

  get isGameLoaded$() {
    return this._isGameLoaded$;
  }

  get legacyId$() {
    return this._legacyId$;
  }

  get legacyLabel$() {
    return this._legacyLabel$;
  }

  get visibleElementStacks$() {
    return this._visibleElementStacks$;
  }

  get unlockedTerrains() {
    return this._unlockedTerrains$;
  }

  get visibleReadables$() {
    return this._visibleReadables$;
  }

  onInitialize() {
    this._scheduleNextPoll();
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

      this._legacyId$.next(legacy.id);
      this._legacyLabel$.next(legacy.label);

      await this._pollTokens();
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

  private async _clear() {
    this._isRunning$.next(false);
    this._fault$.next(null);
    this._legacyId$.next(null);
    this._legacyLabel$.next(null);
  }

  private _getOrUpdateElementStackModel(
    elementStack: ElementStack
  ): ElementStackModel {
    let model = this._elementStackModels.get(elementStack.id);
    if (!model) {
      model = new ElementStackModel(elementStack, this._api, this);
      this._elementStackModels.set(elementStack.id, model);
    }

    model._onUpdate(elementStack);
    return model;
  }

  private _getOrUpdateConnectedTerrainModel(
    connectedTerrain: ConnectedTerrain
  ): ConnectedTerrainModel {
    let model = this._connectedTerrainModels.get(connectedTerrain.id);
    if (!model) {
      model = new ConnectedTerrainModel(connectedTerrain);
      this._connectedTerrainModels.set(connectedTerrain.id, model);
    }

    model._onUpdate(connectedTerrain);
    return model;
  }
}

function arrayShallowEquals<T>(a: T[], b: T[]) {
  if (a.length !== b.length) {
    return false;
  }

  return a.every((x, i) => x === b[i]);
}
