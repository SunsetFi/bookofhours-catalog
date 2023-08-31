import { Element } from "secrethistories-api";

import { API } from "../sh-api";

export class ElementModel {
  constructor(private readonly _element: Element, private readonly _api: API) {}

  get id() {
    return this._element.id;
  }

  get label() {
    return this._element.label;
  }

  get description() {
    return this._element.description;
  }

  get iconUrl() {
    return `${this._api.baseUrl}/api/compendium/elements/${this.id}/icon.png`;
  }

  get aspects() {
    return this._element.aspects;
  }
}
