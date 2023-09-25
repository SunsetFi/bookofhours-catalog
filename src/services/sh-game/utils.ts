import {
  ConnectedTerrain,
  ElementStack,
  Situation,
  Token,
} from "secrethistories-api";

// TODO: Move to api lib

export function isElementStack(x: Token): x is ElementStack {
  return x.payloadType === "ElementStack";
}

export function isSituation(x: Token): x is Situation {
  return x.payloadType === "Situation";
}

export function isConnectedTerrain(x: Token): x is ConnectedTerrain {
  return x.payloadType === "ConnectedTerrain";
}
