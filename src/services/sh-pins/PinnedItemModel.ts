import {
  BehaviorSubject,
  Observable,
  Subscription,
  firstValueFrom,
  map,
} from "rxjs";
import { Aspects } from "secrethistories-api";

import { Compendium, ElementModel } from "../sh-compendium";
import { ElementStackModel } from "../sh-game";
import { TokensSource } from "../sh-game/sources/TokensSource";

export class PinnedItemModel {
  constructor(
    private readonly _item: ElementModel | ElementStackModel,
    private readonly _produce: Function,
    private readonly _tokensSource: TokensSource,
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
        this._tokensSource.visibleElementStacks$
      );
      return tokens.filter((t) => t.elementId == this._item.id);
    }

    return [];
  }
}
