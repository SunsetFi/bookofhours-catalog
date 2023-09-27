import { inject, injectable, singleton } from "microinject";
import { BehaviorSubject, Observable } from "rxjs";

import { Compendium } from "../sh-compendium";
import { Orchestrator } from "../sh-game/orchestration";
import { TokensSource } from "../sh-game";

import { PinItemRequest } from "./types";
import { PinnedItemModel } from "./PinnedItemModel";

@injectable()
@singleton()
export class Pinboard {
  private readonly _pins$ = new BehaviorSubject<readonly PinnedItemModel[]>([]);

  constructor(
    @inject(TokensSource) private readonly _tokensSource: TokensSource,
    @inject(Compendium) private readonly _compendium: Compendium,
    @inject(Orchestrator) private readonly _orchestrator: Orchestrator
  ) {}

  get pins$(): Observable<readonly PinnedItemModel[]> {
    return this._pins$;
  }

  async pin(item: PinItemRequest) {
    const elementModel = await this._compendium.getElementById(item.elementId);

    let model: PinnedItemModel;
    model = new PinnedItemModel(
      elementModel,
      () =>
        item.produce
          ? this._orchestrator.requestOrchestration(item.produce)
          : null,
      this._tokensSource,
      this._compendium,
      () => this.remove(model)
    );

    this._pins$.next([...this._pins$.value, model]);
  }

  remove(model: PinnedItemModel) {
    this._pins$.next(this._pins$.value.filter((x) => x !== model));
  }

  clear() {
    this._pins$.next([]);
  }
}
