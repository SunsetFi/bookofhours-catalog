import { inject, injectable, singleton } from "microinject";
import { BehaviorSubject, Observable, map, shareReplay, tap } from "rxjs";

import { Compendium } from "../sh-compendium";

import { PinItemRequest } from "./types";
import { PinnedElementItemModel, PinnedItemModel } from "./PinnedItemModel";
import { mapArrayItemsCached, observeAll } from "@/observables";

@injectable()
@singleton()
export class Pinboard {
  private readonly _pins$ = new BehaviorSubject<readonly PinnedItemModel[]>([]);

  constructor(@inject(Compendium) private readonly _compendium: Compendium) {}

  get pins$(): Observable<readonly PinnedItemModel[]> {
    return this._pins$;
  }

  async isTokenPinned$(tokenId: string) {
    return new BehaviorSubject(false);
  }

  isElementPinned$(elementId: string) {
    return this._pins$.pipe(
      mapArrayItemsCached((x) => x.elementId$),
      observeAll(),
      map((items) => items.includes(elementId)),
      shareReplay(1)
    );
  }

  async pin(item: PinItemRequest) {
    const elementModel = await this._compendium.getElementById(item.elementId);

    let model: PinnedItemModel;
    model = new PinnedElementItemModel(elementModel, () => this.remove(model));

    this._pins$.next([...this._pins$.value, model]);
  }

  removeElementId(elementId: string) {
    this._pins$.next(
      this._pins$.value.filter((x) => x.elementId !== elementId)
    );
  }

  remove(model: PinnedItemModel) {
    this._pins$.next(this._pins$.value.filter((x) => x !== model));
  }

  clear() {
    this._pins$.next([]);
  }
}
