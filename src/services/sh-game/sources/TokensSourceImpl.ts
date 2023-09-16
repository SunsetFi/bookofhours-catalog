import { startTransition } from "react";
import { BehaviorSubject, Observable } from "rxjs";
import { inject, injectable, provides, singleton } from "microinject";
import { Token } from "secrethistories-api";
import { difference, sortBy } from "lodash";

import { arrayShallowEquals } from "@/utils";

import { Scheduler, TaskUnsubscriber } from "../../scheduler";
import { API } from "../../sh-api";

import { TokenModel } from "../token-models/TokenModel";
import { TokenModelFactory } from "../token-models/TokenModelFactory";

import { TokensSource, RunningSource } from "./services";

const supportedPayloadTypes = [
  "ConnectedTerrain",
  "ElementStack",
  "Situation",
  "WorkstationSituation",
];

@injectable()
@singleton()
@provides(TokensSource)
export class TokensSourceImpl implements TokensSource {
  private _tokensTaskSubsciption: TaskUnsubscriber | null = null;
  private readonly _tokenModels: Map<string, TokenModel> = new Map();
  private readonly _tokensInternal$ = new BehaviorSubject<
    readonly TokenModel[]
  >([]);

  constructor(
    @inject(Scheduler) scheduler: Scheduler,
    @inject(RunningSource) runningSource: RunningSource,
    @inject(API) private readonly _api: API,
    @inject(TokenModelFactory)
    private readonly _tokenModelFactory: TokenModelFactory
  ) {
    runningSource.isRunning$.subscribe((isRunning) => {
      if (!isRunning) {
        if (this._tokensTaskSubsciption) {
          this._tokensTaskSubsciption();
          this._tokensTaskSubsciption = null;
        }
      } else {
        if (!this._tokensTaskSubsciption) {
          this._tokensTaskSubsciption = scheduler.addTask(() =>
            this._pollTokens()
          );
        }
      }
    });
  }

  get tokens$(): Observable<readonly TokenModel[]> {
    return this._tokensInternal$;
  }

  private async _pollTokens() {
    // I suppose pulling every single token is ok.  This could be better, but its workable for now.
    const tokens = await this._api.getAllTokens();

    startTransition(() => {
      const supportedTokens = tokens.filter((x) =>
        supportedPayloadTypes.includes(x.payloadType)
      );

      const existingTokenIds = Array.from(this._tokenModels.keys());
      const tokenIdsToRemove = difference(
        existingTokenIds,
        supportedTokens.map((x) => x.id)
      );
      tokenIdsToRemove.forEach((id) => this._tokenModels.delete(id));

      const tokenModels = sortBy(
        supportedTokens.map((token) => this._getOrUpdateTokenModel(token)),
        "id"
      );

      if (!arrayShallowEquals(this._tokensInternal$.value, tokenModels)) {
        this._tokensInternal$.next(tokenModels);
      }
    });
  }

  private _getOrUpdateTokenModel(token: Token): TokenModel {
    let model: TokenModel;
    if (!this._tokenModels.has(token.id)) {
      model = this._tokenModelFactory.create(token);
      this._tokenModels.set(token.id, model);
    } else {
      model = this._tokenModels.get(token.id)!;
      model.update(token);
    }

    return model;
  }
}
