import { inject, injectable, singleton } from "microinject";
import { BehaviorSubject, Observable, map, shareReplay, tap } from "rxjs";

import { Compendium } from "../sh-compendium";

import { PinItemRequest } from "./types";
import { PinnedElementItemModel, PinnedItemModel } from "./PinnedItemModel";
import { mapArrayItems, mapArrayItemsCached, observeAll } from "@/observables";

export interface PinnedAspect {
  readonly current: number;
  readonly desired: number;
}

@injectable()
@singleton()
export class Pinboard {
  private readonly _pins$ = new BehaviorSubject<readonly PinnedItemModel[]>([]);

  constructor(@inject(Compendium) private readonly _compendium: Compendium) {}

  get pins$(): Observable<readonly PinnedItemModel[]> {
    return this._pins$;
  }

  private _pinnedAspects$: Observable<
    Readonly<Record<string, PinnedAspect>>
  > | null = null;
  get pinnedAspects$() {
    if (!this._pinnedAspects$) {
      this._pinnedAspects$ = this._pins$.pipe(
        mapArrayItems((x) => x.aspects$),
        observeAll(),
        map((aspectArray) => {
          const result: Record<string, PinnedAspect> = {};
          for (const aspects of aspectArray) {
            for (const aspect of Object.keys(aspects)) {
              result[aspect] = {
                desired: 0,
                current: (result[aspect]?.current ?? 0) + aspects[aspect],
              };
            }
          }
          return result;
        }),
        shareReplay(1)
      );
    }

    return this._pinnedAspects$;
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
