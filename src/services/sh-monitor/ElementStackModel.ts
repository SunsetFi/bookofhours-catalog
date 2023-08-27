import { Aspects, ElementStack as IElementStack } from "secrethistories-api";
import {
  BehaviorSubject,
  Observable,
  map,
  combineLatest,
  distinctUntilChanged,
} from "rxjs";
import { isEqual } from "lodash";

import { API } from "../sh-api";
import { ConnectedTerrainModel } from "./ConnectedTerrainModel";
import { GameModel } from "./GameModel";

export class ElementStackModel {
  private readonly _elementStackInternal$: BehaviorSubject<IElementStack>;
  private readonly _elementStack$: Observable<IElementStack>;

  private readonly _elementId$: Observable<string>;
  private readonly _path$: Observable<string>;
  private readonly _quantity$: Observable<number>;
  private readonly _lifetimeRemaining$: Observable<number>;
  private readonly _elementAspects$: Observable<Aspects>;
  private readonly _mutations$: Observable<Aspects>;
  private readonly _shrouded$: Observable<boolean>;
  private readonly _label$: Observable<string>;
  private readonly _description$: Observable<string>;
  private readonly _decays$: Observable<boolean>;
  private readonly _unique$: Observable<boolean>;

  private readonly _parentConnectedTerrain$: Observable<ConnectedTerrainModel | null>;

  constructor(
    elementStack: IElementStack,
    private readonly _api: API,
    gameModel: GameModel
  ) {
    this._elementStackInternal$ = new BehaviorSubject<IElementStack>(
      elementStack
    );
    this._elementStack$ = this._elementStackInternal$.pipe(
      distinctUntilChanged(isEqual)
    );

    this._elementId$ = this._elementStack$.pipe(map((e) => e.elementId));
    this._path$ = this._elementStack$.pipe(map((e) => e.path));
    this._quantity$ = this._elementStack$.pipe(map((e) => e.quantity));
    this._lifetimeRemaining$ = this._elementStack$.pipe(
      map((e) => e.lifetimeRemaining)
    );
    this._elementAspects$ = this._elementStack$.pipe(
      map((e) => e.elementAspects)
    );
    this._mutations$ = this._elementStack$.pipe(map((e) => e.mutations));
    this._shrouded$ = this._elementStack$.pipe(map((e) => e.shrouded));
    this._label$ = this._elementStack$.pipe(map((e) => e.label));
    this._description$ = this._elementStack$.pipe(map((e) => e.description));
    this._decays$ = this._elementStack$.pipe(map((e) => e.decays));
    this._unique$ = this._elementStack$.pipe(map((e) => e.unique));
    this._parentConnectedTerrain$ = combineLatest([
      this._elementStack$,
      gameModel.unlockedTerrains,
    ]).pipe(
      map(([elementStack, terrains]) => {
        const tokenId = extractTokenId(elementStack.path);
        if (tokenId === null) {
          return null;
        }

        const terrain = terrains.find((t) => t.id === tokenId);
        if (terrain === undefined) {
          return null;
        }

        return terrain;
      })
    );
  }

  get id(): string {
    return this._elementStackInternal$.value.id;
  }

  get payloadType(): "ElementStack" {
    return "ElementStack";
  }

  // Shame we have to use this, but data grid doesnt place nice with observables.
  get elementStack$() {
    return this._elementStack$;
  }

  get elementId$() {
    return this._elementId$;
  }

  get path$() {
    return this._path$;
  }

  get parentTerrain$() {
    return this._parentConnectedTerrain$;
  }

  get quantity$() {
    return this._quantity$;
  }

  get iconUrl(): string {
    return `${this._api.baseUrl}/api/by-path/${this._elementStackInternal$.value.path}/icon.png`;
  }

  get lifetimeRemaining$() {
    return this._lifetimeRemaining$;
  }

  get elementAspects$() {
    return this._elementAspects$;
  }

  get mutations$() {
    return this._mutations$;
  }

  get shrouded$() {
    return this._shrouded$;
  }

  get label$() {
    return this._label$;
  }

  get description$() {
    return this._description$;
  }

  get decays$() {
    return this._decays$;
  }

  get unique$() {
    return this._unique$;
  }

  _onUpdate(element: IElementStack) {
    if (element.id !== this.id) {
      throw new Error("Invalid situation update: Wrong ID.");
    }

    this._elementStackInternal$.next(element);
  }
}

function extractTokenId(path: string): string | null {
  if (!path.startsWith("~/library")) {
    return null;
  }
  const innerSpherePath = path.substring("~/library".length);
  if (!innerSpherePath.startsWith("!") && !innerSpherePath.startsWith("/!")) {
    return null;
  }

  let endIndex = innerSpherePath.indexOf("/", 1);
  if (endIndex === -1) {
    endIndex = innerSpherePath.length - 1;
  }

  const token = innerSpherePath.substring(0, endIndex);
  return token;
}
