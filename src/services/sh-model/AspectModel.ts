import { Element } from "secrethistories-api";

import { API } from "../sh-api";

export class AspectModel {
  constructor(private readonly _element: Element, private readonly _api: API) {}

  get id() {
    return this._element.id;
  }

  get label() {
    return this._element.label;
  }

  get iconUrl() {
    return `${this._api.baseUrl}/api/compendium/elements/${this.id}/icon.png`;
  }
}
