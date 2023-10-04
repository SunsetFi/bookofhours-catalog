import {
  Aspects,
  ElementStack as IElementStack,
  combineAspects,
} from "secrethistories-api";
import {
  BehaviorSubject,
  Observable,
  map,
  distinctUntilChanged,
  shareReplay,
  combineLatest,
} from "rxjs";
import { isEqual } from "lodash";

import { Compendium, ElementModel } from "@/services/sh-compendium";
import { API } from "@/services/sh-api";

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
  extends TokenModel
  implements
    ModelWithLabel,
    ModelWithDescription,
    ModelWithAspects,
    ModelWithIconUrl,
    ModelWithParentTerrain
{
  private readonly _elementStack$: BehaviorSubject<IElementStack>;

  private readonly _visible$: Observable<boolean>;
  private readonly _parentTerrain$: Observable<ConnectedTerrainModel | null>;

  constructor(
    elementStack: IElementStack,
    api: API,
    private readonly _compendium: Compendium,
    visibilityFactory: TokenVisibilityFactory,
    parentTerrainFactory: TokenParentTerrainFactory
  ) {
    super(elementStack, api);
    this._elementStack$ = new BehaviorSubject<IElementStack>(elementStack);

    this._visible$ = visibilityFactory.createVisibilityObservable(
      this._elementStack$
    );

    this._parentTerrain$ = parentTerrainFactory.createParentTerrainObservable(
      this._elementStack$
    );
  }

  get id(): string {
    return this._elementStack$.value.id;
  }

  get payloadType(): "ElementStack" {
    return "ElementStack";
  }

  private _elementId$: Observable<string> | null = null;
  get elementId$() {
    if (!this._elementId$) {
      this._elementId$ = this._elementStack$.pipe(
        map((e) => e.elementId),
        distinctUntilChanged(),
        shareReplay(1)
      );
    }

    return this._elementId$;
  }

  get elementId() {
    return this._elementStack$.value.elementId;
  }

  private _element$: Observable<ElementModel> | null = null;
  get element$() {
    if (!this._element$) {
      this._element$ = this._elementStack$.pipe(
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
      this._label$ = this._elementStack$.pipe(
        map((e) => e.label),
        distinctUntilChanged(),
        shareReplay(1)
      );
    }

    return this._label$;
  }

  private _description$: Observable<string | null> | null = null;
  get description$() {
    if (!this._description$) {
      this._description$ = this._elementStack$.pipe(
        map((e) => e.description),
        distinctUntilChanged(),
        shareReplay(1)
      );
    }

    return this._description$;
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
      this._quantity$ = this._elementStack$.pipe(
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
      this._iconUrl$ = this._elementStack$.pipe(
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
      this._lifetimeRemaining$ = this._elementStack$.pipe(
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
      this._elementAspects$ = this._elementStack$.pipe(
        map((e) => e.elementAspects),
        distinctUntilChanged(),
        shareReplay(1)
      );
    }

    return this._elementAspects$;
  }
  get elementAspects() {
    return this._elementStack$.value.elementAspects;
  }

  private _mutations$: Observable<Aspects> | null = null;
  get mutations$() {
    if (!this._mutations$) {
      this._mutations$ = this._elementStack$.pipe(
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
      this._aspects$ = this._elementStack$.pipe(
        map((e) => combineAspects(e.elementAspects, e.mutations)),
        distinctUntilChanged(isEqual),
        shareReplay(1)
      );
    }

    return this._aspects$;
  }

  get aspects() {
    const value = this._elementStack$.value;
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
      this._shrouded$ = this._elementStack$.pipe(
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
      this._decays$ = this._elementStack$.pipe(
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
      this._unique$ = this._elementStack$.pipe(
        map((e) => e.unique),
        distinctUntilChanged(),
        shareReplay(1)
      );
    }

    return this._unique$;
  }

  async moveToSphere(spherePath: string) {
    try {
      await this._api.updateTokenAtPath(this.path, {
        spherePath,
      });
      this._elementStack$.next({
        ...this._elementStack$.value,
        path: `${spherePath}/${this.id}`,
        spherePath,
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  _onUpdate(element: IElementStack) {
    if (element.id !== this.id) {
      throw new Error("Invalid situation update: Wrong ID.");
    }

    this._elementStack$.next(element);
  }
}
