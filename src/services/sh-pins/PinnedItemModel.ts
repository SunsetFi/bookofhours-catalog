import {
  BehaviorSubject,
  Observable,
  Subscription,
  firstValueFrom,
  map,
} from "rxjs";
import { Aspects } from "secrethistories-api";

import { ElementStackModel, GameModel } from "../sh-game";
import { Compendium, ElementModel } from "../sh-compendium";

export class PinnedItemModel {
  constructor(
    private readonly _item: ElementModel | ElementStackModel,
    private readonly _produce: Function,
    private readonly _gameModel: GameModel,
    private readonly _compendium: Compendium,
    private readonly _remove: (item: PinnedItemModel) => void
  ) {
    if (_item instanceof ElementStackModel) {
      let sub: Subscription | null = null;
      sub = _item.retired$.subscribe((retired) => {
        if (retired) {
          sub?.unsubscribe();
          _remove(this);
        }
      });
    }
  }

  get iconUrl(): string {
    return this._item.iconUrl;
  }

  private _element$: Observable<ElementModel> | null = null;
  get element$(): Observable<ElementModel> {
    if (!this._element$) {
      if (this._item instanceof ElementModel) {
        this._element$ = new BehaviorSubject<ElementModel>(this._item);
      } else {
        this._element$ = this._item.elementId$.pipe(
          map((elementId) => this._compendium.getElementById(elementId))
        );
      }
    }

    return this._element$;
  }

  // Bit weird, we have to return nullable because ElementModels load in after they are created.
  get label$(): Observable<string | null> {
    return this._item.label$;
  }

  get aspects$(): Observable<Readonly<Aspects>> {
    return this._item.aspects$;
  }

  get producable() {
    return this._produce != null;
  }

  remove() {
    this._remove(this);
  }

  produce() {
    if (this._produce) {
      return this._produce();
    }
  }

  async getCandidateStacks(): Promise<ElementStackModel[]> {
    if (this._item instanceof ElementStackModel) {
      return [this._item];
    }

    if (this._item instanceof ElementModel) {
      const tokens = await firstValueFrom(
        this._gameModel.visibleElementStacks$
      );
      return tokens.filter((t) => t.elementId == this._item.id);
    }

    return [];
  }
}
