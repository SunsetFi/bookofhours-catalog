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

const spherePaths = [
  "~/portage1",
  "~/portage2",
  "~/portage3",
  "~/portage4",
  "~/portage5",
  "~/hand.abilities",
  "~/hand.skills",
  "~/hand.memories",
  "~/hand.misc",
  "~/library",
];

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

  private readonly _tokens$ = new BehaviorSubject<readonly TokenModel[]>([]);

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
    return this._tokens$;
  }

  private async _pollTokens() {
    const tokens = await this._api.getAllTokens({
      spherePrefix: spherePaths,
      payloadType: supportedPayloadTypes,
    });

    const existingTokenIds = Array.from(this._tokenModels.keys());
    const foundIds = tokens.map((t) => t.id);
    const tokenIdsToRemove = difference(existingTokenIds, foundIds);
    tokenIdsToRemove.forEach((id) => {
      const token = this._tokenModels.get(id);
      if (token) {
        token.retire();
        this._tokenModels.delete(id);
      }
    });

    startTransition(() => {
      this._updateTokenModels(tokens, this._tokens$);
    });
  }

  private _updateTokenModels(
    tokens: Token[],
    subject: BehaviorSubject<readonly TokenModel[]>
  ) {
    const tokenModels = sortBy(
      tokens.map((token) => this._getOrUpdateTokenModel(token)),
      "id"
    );

    if (!arrayShallowEquals(subject.value, tokenModels)) {
      subject.next(tokenModels);
    }
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
