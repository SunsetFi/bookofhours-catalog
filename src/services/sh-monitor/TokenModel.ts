import { Token } from "secrethistories-api";

export abstract class TokenModel {
  private readonly _id: string;
  private readonly _payloadType: Token["payloadType"];
  constructor(token: Token) {
    this._id = token.id;
    this._payloadType = token.payloadType;
  }

  get id() {
    return this._id;
  }

  get payloadType() {
    return this._payloadType;
  }

  abstract _onUpdate(token: Token): void;
}
