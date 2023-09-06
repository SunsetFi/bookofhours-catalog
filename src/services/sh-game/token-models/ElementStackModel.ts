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
    private readonly _api: API,
    private readonly _compendium: Compendium,
    visibilityFactory: TokenVisibilityFactory,
    parentTerrainFactory: TokenParentTerrainFactory
  ) {
    super(elementStack);
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

  private _element$: Observable<ElementModel> | null = null;
  get element$() {
    this._element$ = this._elementStack$.pipe(
      map((elementStack) => elementStack.elementId),
      distinctUntilChanged(),
      map((elementId) => this._compendium.getElementById(elementId)),
      shareReplay(1)
    );

    return this._element$;
  }

  private _label$: Observable<string | null> | null = null;
  get label$() {
    this._label$ = this._elementStack$.pipe(
      map((e) => e.label),
      distinctUntilChanged(),
      shareReplay(1)
    );

    return this._label$;
  }

  private _description$: Observable<string | null> | null = null;
  get description$() {
    this._description$ = this._elementStack$.pipe(
      map((e) => e.description),
      distinctUntilChanged(),
      shareReplay(1)
    );

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
    this._quantity$ = this._elementStack$.pipe(
      map((e) => e.quantity),
      distinctUntilChanged(),
      shareReplay(1)
    );

    return this._quantity$;
  }

  get iconUrl(): string {
    return `${this._api.baseUrl}/api/by-path/${this.path}/icon.png`;
  }

  private _lifetimeRemaining$: Observable<number> | null = null;
  get lifetimeRemaining$() {
    this._lifetimeRemaining$ = this._elementStack$.pipe(
      map((e) => e.lifetimeRemaining),
      distinctUntilChanged(),
      shareReplay(1)
    );

    return this._lifetimeRemaining$;
  }

  private _elementAspects$: Observable<Aspects> | null = null;
  get elementAspects$() {
    this._elementAspects$ = this._elementStack$.pipe(
      map((e) => e.elementAspects),
      distinctUntilChanged(),
      shareReplay(1)
    );

    return this._elementAspects$;
  }

  private _mutations$: Observable<Aspects> | null = null;
  get mutations$() {
    this._mutations$ = this._elementStack$.pipe(
      map((e) => e.mutations),
      distinctUntilChanged(),
      shareReplay(1)
    );

    return this._mutations$;
  }

  private _aspects$: Observable<Aspects> | null = null;
  get aspects$() {
    this._aspects$ = this._elementStack$.pipe(
      map((e) => combineAspects(e.elementAspects, e.mutations)),
      distinctUntilChanged(isEqual),
      shareReplay(1)
    );

    return this._aspects$;
  }

  private _shrouded$: Observable<boolean> | null = null;
  get shrouded$() {
    this._shrouded$ = this._elementStack$.pipe(
      map((e) => e.shrouded),
      distinctUntilChanged(),
      shareReplay(1)
    );

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

  _onUpdate(element: IElementStack) {
    if (element.id !== this.id) {
      throw new Error("Invalid situation update: Wrong ID.");
    }

    this._elementStack$.next(element);
  }
}
