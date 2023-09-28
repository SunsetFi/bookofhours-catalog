import { BehaviorSubject, Observable } from "rxjs";
import { Aspects } from "secrethistories-api";

import { ElementModel } from "../sh-compendium";

export interface PinnedItemModel {
  readonly iconUrl: string;
  readonly elementId: string | null;
  readonly elementId$: Observable<string | null>;
  readonly label$: Observable<string | null>;
  readonly aspects$: Observable<Readonly<Aspects>>;
  remove(): void;
}

export class PinnedElementItemModel implements PinnedItemModel {
  private readonly _item$: BehaviorSubject<ElementModel>;
  private readonly _elementId$: BehaviorSubject<string | null>;

  constructor(
    private readonly _item: ElementModel,
    private readonly _remove: (item: PinnedItemModel) => void
  ) {
    this._item$ = new BehaviorSubject(_item);
    this._elementId$ = new BehaviorSubject<string | null>(_item.elementId);
  }

  get elementId$(): Observable<string | null> {
    return this._elementId$;
  }

  get elementId(): string | null {
    return this._item.elementId;
  }

  get iconUrl(): string {
    return this._item.iconUrl;
  }

  get element$(): Observable<ElementModel> {
    return this._item$;
  }

  get label$(): Observable<string | null> {
    return this._item.label$;
  }

  get aspects$(): Observable<Readonly<Aspects>> {
    return this._item.aspects$;
  }

  remove() {
    this._remove(this);
  }
}

export function isPinnedElementItemModel(
  item: PinnedItemModel
): item is PinnedElementItemModel {
  return item instanceof PinnedElementItemModel;
}
