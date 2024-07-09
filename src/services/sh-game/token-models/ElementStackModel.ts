import {
  Aspects,
  ElementStack as IElementStack,
  combineAspects,
  APINetworkError,
  ElementStack,
} from "secrethistories-api";
import {
  Observable,
  map,
  distinctUntilChanged,
  shareReplay,
  combineLatest,
} from "rxjs";
import { isEqual, pickBy } from "lodash";

import { Compendium, ElementModel } from "@/services/sh-compendium";
import { API } from "@/services/sh-api";
import { BatchingScheduler } from "@/services/scheduler";

import {
  ModelWithLabel,
  ModelWithDescription,
  ModelWithAspects,
  ModelWithIconUrl,
  ModelWithParentTerrain,
} from "../types";

import type { ConnectedTerrainModel } from "./ConnectedTerrainModel";
import { TokenModel } from "./TokenModel";
import { TokenVisibilityFactory } from "./TokenVisibilityFactory";
import { TokenParentTerrainFactory } from "./TokenParentTerrainFactory";

export function isElementStackModel(
  model: TokenModel
): model is ElementStackModel {
  return model instanceof ElementStackModel;
}

export class ElementStackModel
  extends TokenModel<ElementStack>
  implements
    ModelWithLabel,
    ModelWithDescription,
    ModelWithAspects,
    ModelWithIconUrl,
    ModelWithParentTerrain
{
  private readonly _visible$: Observable<boolean>;
  private readonly _parentTerrain$: Observable<ConnectedTerrainModel | null>;

  constructor(
    elementStack: IElementStack,
    api: API,
    private readonly _compendium: Compendium,
    visibilityFactory: TokenVisibilityFactory,
    parentTerrainFactory: TokenParentTerrainFactory,
    private readonly _scheduler: BatchingScheduler
  ) {
    super(elementStack, api);

    this._visible$ = visibilityFactory.createVisibilityObservable(this._token$);

    this._parentTerrain$ = parentTerrainFactory.createParentTerrainObservable(
      this._token$
    );
  }

  private _elementId$: Observable<string> | null = null;
  get elementId$() {
    if (!this._elementId$) {
      this._elementId$ = this._token$.pipe(
        map((e) => e.elementId),
        distinctUntilChanged(),
        shareReplay(1)
      );
    }

    return this._elementId$;
  }

  get elementId() {
    return this._token.elementId;
  }

  private _element$: Observable<ElementModel> | null = null;
  get element$() {
    if (!this._element$) {
      this._element$ = this._token$.pipe(
        map((elementStack) => elementStack.elementId),
        distinctUntilChanged(),
        map((elementId) => this._compendium.getElementById(elementId)),
        shareReplay(1)
      );
    }

    return this._element$;
  }

  private _label$: Observable<string | null> | null = null;
  get label$() {
    if (!this._label$) {
      this._label$ = this._token$.pipe(
        map((e) => e.label),
        distinctUntilChanged(),
        shareReplay(1)
      );
    }

    return this._label$;
  }

  get label() {
    return this._token.label;
  }

  private _description$: Observable<string | null> | null = null;
  get description$() {
    if (!this._description$) {
      this._description$ = this._token$.pipe(
        map((e) => e.description),
        distinctUntilChanged(),
        shareReplay(1)
      );
    }

    return this._description$;
  }

  private _illuminations$: Observable<Readonly<Record<string, string>>> | null =
    null;
  get illuminations$() {
    if (!this._illuminations$) {
      this._illuminations$ = this._token$.pipe(
        map((e) => e.illuminations),
        distinctUntilChanged(isEqual),
        shareReplay(1)
      );
    }

    return this._illuminations$;
  }

  get visible$() {
    return this._visible$;
  }

  get parentTerrain$() {
    return this._parentTerrain$;
  }

  private _quantity$: Observable<number> | null = null;
  get quantity$() {
    if (!this._quantity$) {
      this._quantity$ = this._token$.pipe(
        map((e) => e.quantity),
        distinctUntilChanged(),
        shareReplay(1)
      );
    }

    return this._quantity$;
  }

  private _iconUrl$: Observable<string> | null = null;
  get iconUrl$() {
    if (!this._iconUrl$) {
      this._iconUrl$ = this._token$.pipe(
        map(
          (stack) =>
            `${this._api.baseUrl}/api/compendium/elements/${stack.elementId}/icon.png`
        ),
        distinctUntilChanged(),
        shareReplay(1)
      );
    }

    return this._iconUrl$;
  }

  private _lifetimeRemaining$: Observable<number> | null = null;
  get lifetimeRemaining$() {
    if (!this._lifetimeRemaining$) {
      this._lifetimeRemaining$ = this._token$.pipe(
        map((e) => e.lifetimeRemaining),
        distinctUntilChanged(),
        shareReplay(1)
      );
    }

    return this._lifetimeRemaining$;
  }

  private _elementAspects$: Observable<Aspects> | null = null;
  get elementAspects$() {
    if (!this._elementAspects$) {
      this._elementAspects$ = this._token$.pipe(
        map((e) => e.elementAspects),
        distinctUntilChanged(),
        shareReplay(1)
      );
    }

    return this._elementAspects$;
  }
  get elementAspects() {
    return this._token.elementAspects;
  }

  private _mutations$: Observable<Aspects> | null = null;
  get mutations$() {
    if (!this._mutations$) {
      this._mutations$ = this._token$.pipe(
        map((e) => e.mutations),
        distinctUntilChanged(),
        shareReplay(1)
      );
    }

    return this._mutations$;
  }

  private _aspects$: Observable<Aspects> | null = null;
  get aspects$() {
    if (!this._aspects$) {
      this._aspects$ = this._token$.pipe(
        map((e) =>
          pickBy(combineAspects(e.elementAspects, e.mutations), (v) => v !== 0)
        ),
        distinctUntilChanged(isEqual),
        shareReplay(1)
      );
    }

    return this._aspects$;
  }

  get aspects() {
    const value = this._token;
    if (!value) {
      return {};
    }

    return combineAspects(value.elementAspects, value.mutations);
  }

  private _aspectsAndSelf$: Observable<Aspects> | null = null;
  get aspectsAndSelf$() {
    if (!this._aspectsAndSelf$) {
      this._aspectsAndSelf$ = combineLatest([
        this.aspects$,
        this.elementId$,
      ]).pipe(
        map(([aspects, elementId]) => ({
          ...aspects,
          [elementId]: 1,
        })),
        shareReplay(1)
      );
    }

    return this._aspectsAndSelf$;
  }

  get aspectsAndSelf() {
    const aspects = this.aspects;
    const elementId = this.elementId;
    return {
      ...aspects,
      [elementId]: 1,
    };
  }

  private _shrouded$: Observable<boolean> | null = null;
  get shrouded$() {
    if (!this._shrouded$) {
      this._shrouded$ = this._token$.pipe(
        map((e) => e.shrouded),
        distinctUntilChanged(),
        shareReplay(1)
      );
    }

    return this._shrouded$;
  }

  private _decays$: Observable<boolean> | null = null;
  get decays$() {
    if (!this._decays$) {
      this._decays$ = this._token$.pipe(
        map((e) => e.decays),
        distinctUntilChanged(),
        shareReplay(1)
      );
    }

    return this._decays$;
  }

  private _unique$: Observable<boolean> | null = null;
  get unique$() {
    if (!this._unique$) {
      this._unique$ = this._token$.pipe(
        map((e) => e.unique),
        distinctUntilChanged(),
        shareReplay(1)
      );
    }

    return this._unique$;
  }

  async moveToSphere(spherePath: string) {
    return this._scheduler.batchUpdate(async () => {
      try {
        const now = Date.now();
        await this._api.updateTokenById(this.id, {
          spherePath,
        });
        this._update(
          {
            ...this._token,
            path: `${spherePath}/${this.id}`,
            spherePath,
          },
          now
        );
        return true;
      } catch (e) {
        if (e instanceof APINetworkError && [400, 409].includes(e.statusCode)) {
          console.warn(
            "Failed to move elementStack",
            this.id,
            "to path",
            spherePath
          );
          return false;
        }

        throw e;
      }
    });
  }

  async evict() {
    return this._scheduler.batchUpdate(async () => {
      const now = Date.now();
      await this._api.evictTokenAtPath(this.path);
      this._update(
        {
          ...this._token,
          path: `~/unknown/${this.id}`,
          spherePath: `~/unknown`,
        },
        now
      );
      await this.refresh();
    });
  }
}
